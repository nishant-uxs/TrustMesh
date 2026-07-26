#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _, Address, Env, String,
};

// --- Minimal companion contracts for integration-style unit tests ---

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
        pub fn init(env: Env, a: Address, owner_a: Address, owner_b: Address) {
            env.storage().instance().set(&1u32, &Organization {
                id: 1,
                owner: owner_a,
                name: String::from_str(&env, "A"),
                org_type: OrgType::Business,
                metadata_uri: String::from_str(&env, "u"),
                verified: true,
                registered_at: 0,
                vendor_count: 0,
            });
            env.storage().instance().set(&2u32, &Organization {
                id: 2,
                owner: owner_b,
                name: String::from_str(&env, "B"),
                org_type: OrgType::Startup,
                metadata_uri: String::from_str(&env, "u"),
                verified: true,
                registered_at: 0,
                vendor_count: 0,
            });
            let _ = a;
        }

        pub fn get_organization(env: Env, org_id: u64) -> Organization {
            env.storage().instance().get(&(org_id as u32)).unwrap()
        }

        pub fn is_verified(env: Env, org_id: u64) -> bool {
            let o: Organization = env.storage().instance().get(&(org_id as u32)).unwrap();
            o.verified
        }

        pub fn set_verified(env: Env, org_id: u64, verified: bool) {
            let mut o: Organization = env.storage().instance().get(&(org_id as u32)).unwrap();
            o.verified = verified;
            env.storage().instance().set(&(org_id as u32), &o);
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
        pub fn ensure_tracked(env: Env, caller: Address, org_id: u64) -> Score {
            let _ = caller;
            Score {
                org_id,
                trust_score: 100,
                completed_relationships: 0,
                verified_reviews: 0,
                average_rating_bps: 0,
                rating_sum: 0,
                disputes_opened: 0,
                disputes_lost: 0,
                last_updated: env.ledger().timestamp(),
            }
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
                review_fee: 1,
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
            let bal: i128 = env.storage().instance().get(&0u32).unwrap_or(0);
            let next = bal + amount;
            env.storage().instance().set(&0u32, &next);
            next
        }

        pub fn balance(env: Env) -> i128 {
            env.storage().instance().get(&0u32).unwrap_or(0)
        }
    }
}

mod relationship_stub {
    use soroban_sdk::{contract, contractimpl, Address, Env, String};

    #[contract]
    pub struct RelationshipStub;

    #[contractimpl]
    impl RelationshipStub {
        pub fn create(
            env: Env,
            caller: Address,
            party_a: Address,
            party_b: Address,
            org_a: u64,
            org_b: u64,
            title: String,
        ) -> u64 {
            let _ = (caller, party_a, party_b, org_a, org_b, title);
            let next: u64 = env.storage().instance().get(&0u32).unwrap_or(1);
            env.storage().instance().set(&0u32, &(next + 1));
            next
        }
    }
}

fn setup_factory(env: &Env) -> (TrustRelationshipFactoryClient<'_>, Address, Address, Address) {
    let admin = Address::generate(env);
    let owner_a = Address::generate(env);
    let owner_b = Address::generate(env);

    let registry_id = env.register(org_registry::OrgRegistry, ());
    let registry = org_registry::OrgRegistryClient::new(env, &registry_id);
    registry.init(&admin, &owner_a, &owner_b);

    let reputation_id = env.register(reputation_stub::ReputationStub, ());
    let treasury_id = env.register(treasury_stub::TreasuryStub, ());
    let relationship_id = env.register(relationship_stub::RelationshipStub, ());

    let factory_id = env.register(TrustRelationshipFactory, ());
    let factory = TrustRelationshipFactoryClient::new(env, &factory_id);
    factory.initialize(
        &admin,
        &registry_id,
        &relationship_id,
        &reputation_id,
        &treasury_id,
    );

    (factory, owner_a, owner_b, treasury_id)
}

#[test]
fn create_relationship_cross_contract() {
    let env = Env::default();
    env.mock_all_auths();
    let (factory, owner_a, _owner_b, treasury_id) = setup_factory(&env);

    let rel_id = factory.create_relationship(
        &owner_a,
        &1u64,
        &2u64,
        &String::from_str(&env, "Website Redesign"),
    );
    assert_eq!(rel_id, 1);
    assert_eq!(factory.total_created(), 1);

    let treasury = treasury_stub::TreasuryStubClient::new(&env, &treasury_id);
    assert_eq!(treasury.balance(), 5);
}

#[test]
fn reject_same_org_relationship() {
    let env = Env::default();
    env.mock_all_auths();
    let (factory, owner_a, _, _) = setup_factory(&env);
    let result = factory.try_create_relationship(
        &owner_a,
        &1u64,
        &1u64,
        &String::from_str(&env, "Invalid"),
    );
    assert_eq!(result, Err(Ok(Error::SameParty)));
}

#[test]
fn reject_unauthorized_creator() {
    let env = Env::default();
    env.mock_all_auths();
    let (factory, _, _, _) = setup_factory(&env);
    let stranger = Address::generate(&env);
    let result = factory.try_create_relationship(
        &stranger,
        &1u64,
        &2u64,
        &String::from_str(&env, "Sneaky Deal"),
    );
    assert_eq!(result, Err(Ok(Error::Unauthorized)));
}

#[test]
fn reject_unverified_org_relationship() {
    let env = Env::default();
    env.mock_all_auths();
    let (factory, owner_a, _, _) = setup_factory(&env);
    // Unverify org B via registry stub
    let (registry, _, _, _) = factory.get_addresses();
    org_registry::OrgRegistryClient::new(&env, &registry).set_verified(&2u64, &false);

    let result = factory.try_create_relationship(
        &owner_a,
        &1u64,
        &2u64,
        &String::from_str(&env, "Should Fail"),
    );
    assert_eq!(result, Err(Ok(Error::OrgNotVerified)));
}

#[test]
fn get_addresses() {
    let env = Env::default();
    env.mock_all_auths();
    let (factory, _, _, _) = setup_factory(&env);
    let (r, rel, rep, t) = factory.get_addresses();
    assert_ne!(r, rel);
    assert_ne!(rep, t);
}

