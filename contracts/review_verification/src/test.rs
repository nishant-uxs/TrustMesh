#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

mod org_registry {
    use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

    #[contract]
    pub struct OrgRegistry;

    #[contracttype]
    #[derive(Clone)]
    pub enum OrgType {
        Business,
        Startup,
        Agency,
        Freelancer,
        Vendor,
        ServiceProvider,
    }

    #[contracttype]
    #[derive(Clone)]
    pub struct Organization {
        pub id: u64,
        pub owner: Address,
        pub name: String,
        pub org_type: OrgType,
        pub metadata_uri: String,
        pub verified: bool,
        pub registered_at: u64,
        pub vendor_count: u32,
    }

    #[contractimpl]
    impl OrgRegistry {
        pub fn seed(env: Env, owner_a: Address, owner_b: Address) {
            env.storage().instance().set(
                &1u32,
                &Organization {
                    id: 1,
                    owner: owner_a,
                    name: String::from_str(&env, "Reviewer"),
                    org_type: OrgType::Agency,
                    metadata_uri: String::from_str(&env, "u"),
                    verified: true,
                    registered_at: 0,
                    vendor_count: 0,
                },
            );
            env.storage().instance().set(
                &2u32,
                &Organization {
                    id: 2,
                    owner: owner_b,
                    name: String::from_str(&env, "Reviewee"),
                    org_type: OrgType::Business,
                    metadata_uri: String::from_str(&env, "u"),
                    verified: true,
                    registered_at: 0,
                    vendor_count: 0,
                },
            );
        }

        pub fn get_organization(env: Env, org_id: u64) -> Organization {
            env.storage().instance().get(&(org_id as u32)).unwrap()
        }
    }
}

mod reputation_stub {
    use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

    #[contract]
    pub struct ReputationStub;

    #[contracttype]
    #[derive(Clone)]
    pub struct Score {
        pub org_id: u64,
        pub trust_score: u32,
        pub completed_relationships: u32,
        pub verified_reviews: u32,
        pub average_rating_bps: u32,
        pub rating_sum: u32,
        pub disputes_opened: u32,
        pub disputes_lost: u32,
        pub last_updated: u64,
    }

    #[contractimpl]
    impl ReputationStub {
        pub fn record_verified_review(
            env: Env,
            caller: Address,
            org_id: u64,
            rating: u32,
        ) -> Score {
            let _ = caller;
            let key = org_id as u32;
            let mut n: u32 = env.storage().instance().get(&key).unwrap_or(0);
            n += 1;
            env.storage().instance().set(&key, &n);
            env.storage().instance().set(&(key + 500), &rating);
            Score {
                org_id,
                trust_score: 100 + rating * 3,
                completed_relationships: 0,
                verified_reviews: n,
                average_rating_bps: rating * 100,
                rating_sum: rating,
                disputes_opened: 0,
                disputes_lost: 0,
                last_updated: env.ledger().timestamp(),
            }
        }

        pub fn review_count(env: Env, org_id: u64) -> u32 {
            env.storage().instance().get(&(org_id as u32)).unwrap_or(0)
        }
    }
}

mod treasury_stub {
    use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

    #[contract]
    pub struct TreasuryStub;

    #[contracttype]
    #[derive(Clone)]
    pub struct FeeConfig {
        pub registration_fee: i128,
        pub relationship_fee: i128,
        pub review_fee: i128,
    }

    #[contractimpl]
    impl TreasuryStub {
        pub fn get_fees(_env: Env) -> FeeConfig {
            FeeConfig {
                registration_fee: 10,
                relationship_fee: 5,
                review_fee: 2,
            }
        }

        pub fn record_fee(
            env: Env,
            caller: Address,
            payer: Address,
            fee_type: String,
            amount: i128,
        ) -> i128 {
            let _ = (caller, payer, fee_type);
            let bal: i128 = env.storage().instance().get(&0u32).unwrap_or(0) + amount;
            env.storage().instance().set(&0u32, &bal);
            bal
        }
    }
}

fn setup(
    env: &Env,
) -> (
    ReviewVerificationClient<'_>,
    Address,
    Address,
    Address,
    Address,
) {
    let admin = Address::generate(env);
    let owner_a = Address::generate(env);
    let owner_b = Address::generate(env);

    let registry_id = env.register(org_registry::OrgRegistry, ());
    org_registry::OrgRegistryClient::new(env, &registry_id).seed(&owner_a, &owner_b);

    let reputation_id = env.register(reputation_stub::ReputationStub, ());
    let treasury_id = env.register(treasury_stub::TreasuryStub, ());

    let contract_id = env.register(ReviewVerification, ());
    let client = ReviewVerificationClient::new(env, &contract_id);
    client.initialize(&admin, &registry_id, &reputation_id, &treasury_id);

    (client, admin, owner_a, owner_b, reputation_id)
}

#[test]
fn submit_and_verify_review() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, owner_a, _owner_b, reputation_id) = setup(&env);

    let id = client.submit_review(
        &owner_a,
        &1u64,
        &2u64,
        &10u64,
        &5u32,
        &String::from_str(&env, "hash-abc-12345"),
    );
    assert_eq!(id, 1);

    let review = client.get_review(&id);
    assert!(matches!(review.status, ReviewStatus::Submitted));

    let verified = client.verify_review(&id);
    assert!(matches!(verified.status, ReviewStatus::Verified));

    let rep = reputation_stub::ReputationStubClient::new(&env, &reputation_id);
    assert_eq!(rep.review_count(&2u64), 1);
    let _ = admin;
}

#[test]
fn reject_self_review() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _, owner_a, _, _) = setup(&env);
    assert_eq!(
        client.try_submit_review(
            &owner_a,
            &1u64,
            &1u64,
            &1u64,
            &4u32,
            &String::from_str(&env, "hash-abc-12345")
        ),
        Err(Ok(Error::SelfReview))
    );
}

#[test]
fn reject_duplicate_pair_review() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _, owner_a, _, _) = setup(&env);
    let hash = String::from_str(&env, "hash-abc-12345");
    client.submit_review(&owner_a, &1u64, &2u64, &7u64, &4u32, &hash);
    assert_eq!(
        client.try_submit_review(&owner_a, &1u64, &2u64, &7u64, &3u32, &hash),
        Err(Ok(Error::AlreadySubmitted))
    );
}

#[test]
fn reject_invalid_rating() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _, owner_a, _, _) = setup(&env);
    assert_eq!(
        client.try_submit_review(
            &owner_a,
            &1u64,
            &2u64,
            &1u64,
            &0u32,
            &String::from_str(&env, "hash-abc-12345")
        ),
        Err(Ok(Error::InvalidRating))
    );
}

#[test]
fn reject_review_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _, owner_a, _, _) = setup(&env);
    let id = client.submit_review(
        &owner_a,
        &1u64,
        &2u64,
        &3u64,
        &2u32,
        &String::from_str(&env, "hash-reject-01"),
    );
    let rejected = client.reject_review(&id);
    assert!(matches!(rejected.status, ReviewStatus::Rejected));
    assert_eq!(client.total_reviews(), 1);
}
