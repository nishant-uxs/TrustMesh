#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

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
        pub fn record_completed_relationship(
            env: Env,
            caller: Address,
            org_id: u64,
            quality_score: u32,
        ) -> Score {
            let _ = (caller, quality_score);
            let key = org_id as u32;
            let mut count: u32 = env.storage().instance().get(&key).unwrap_or(0);
            count += 1;
            env.storage().instance().set(&key, &count);
            Score {
                org_id,
                trust_score: 100 + count * 5,
                completed_relationships: count,
                verified_reviews: 0,
                average_rating_bps: 0,
                rating_sum: 0,
                disputes_opened: 0,
                disputes_lost: 0,
                last_updated: env.ledger().timestamp(),
            }
        }

        pub fn record_dispute(env: Env, caller: Address, org_id: u64, lost: bool) -> Score {
            let _ = caller;
            let key = 1000 + (org_id as u32);
            let mut d: u32 = env.storage().instance().get(&key).unwrap_or(0);
            d += 1;
            env.storage().instance().set(&key, &d);
            if lost {
                env.storage().instance().set(&(2000 + org_id as u32), &true);
            }
            Score {
                org_id,
                trust_score: if lost { 75 } else { 102 },
                completed_relationships: 0,
                verified_reviews: 0,
                average_rating_bps: 0,
                rating_sum: 0,
                disputes_opened: d,
                disputes_lost: if lost { 1 } else { 0 },
                last_updated: env.ledger().timestamp(),
            }
        }

        pub fn completed_count(env: Env, org_id: u64) -> u32 {
            env.storage().instance().get(&(org_id as u32)).unwrap_or(0)
        }
    }
}

fn setup(env: &Env) -> (TrustRelationshipClient<'_>, Address, Address, Address, Address) {
    let admin = Address::generate(env);
    let factory = Address::generate(env);
    let party_a = Address::generate(env);
    let party_b = Address::generate(env);

    let reputation_id = env.register(reputation_stub::ReputationStub, ());
    let contract_id = env.register(TrustRelationship, ());
    let client = TrustRelationshipClient::new(env, &contract_id);
    client.initialize(&admin, &factory, &reputation_id);
    (client, admin, factory, party_a, party_b)
}

#[test]
fn full_lifecycle_pending_to_completed() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _, factory, party_a, party_b) = setup(&env);

    let id = client.create(
        &factory,
        &party_a,
        &party_b,
        &1u64,
        &2u64,
        &String::from_str(&env, "API Integration"),
    );
    assert_eq!(id, 1);

    let mut rel = client.accept(&party_a, &id);
    assert!(!matches!(rel.status, RelationshipStatus::Active));
    rel = client.accept(&party_b, &id);
    assert!(matches!(rel.status, RelationshipStatus::Active));

    client.complete(&party_a, &id, &90u32);
    rel = client.complete(&party_b, &id, &95u32);
    assert!(matches!(rel.status, RelationshipStatus::Completed));
    assert_eq!(rel.quality_score, 95);
}

#[test]
fn dispute_open_and_resolve() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, factory, party_a, party_b) = setup(&env);
    let id = client.create(
        &factory,
        &party_a,
        &party_b,
        &1u64,
        &2u64,
        &String::from_str(&env, "Consulting"),
    );
    client.accept(&party_a, &id);
    client.accept(&party_b, &id);

    let disputed = client.open_dispute(
        &party_a,
        &id,
        &String::from_str(&env, "Missed deadline"),
    );
    assert!(matches!(disputed.status, RelationshipStatus::Disputed));

    let resolved = client.resolve_dispute(&id, &DisputeOutcome::PartyAWins);
    assert!(matches!(resolved.status, RelationshipStatus::Active));
    assert!(matches!(
        resolved.dispute_outcome,
        DisputeOutcome::PartyAWins
    ));
    let _ = admin;
}

#[test]
fn unauthorized_accept_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _, factory, party_a, party_b) = setup(&env);
    let id = client.create(
        &factory,
        &party_a,
        &party_b,
        &1u64,
        &2u64,
        &String::from_str(&env, "Deal"),
    );
    let stranger = Address::generate(&env);
    assert_eq!(
        client.try_accept(&stranger, &id),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn only_factory_can_create() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _, _, party_a, party_b) = setup(&env);
    let stranger = Address::generate(&env);
    assert_eq!(
        client.try_create(
            &stranger,
            &party_a,
            &party_b,
            &1u64,
            &2u64,
            &String::from_str(&env, "Nope")
        ),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn total_relationships() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _, factory, party_a, party_b) = setup(&env);
    client.create(
        &factory,
        &party_a,
        &party_b,
        &1u64,
        &2u64,
        &String::from_str(&env, "One"),
    );
    client.create(
        &factory,
        &party_a,
        &party_b,
        &1u64,
        &2u64,
        &String::from_str(&env, "Two"),
    );
    assert_eq!(client.total_relationships(), 2);
}
