#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (ReputationClient, Address) {
    let contract_id = env.register(Reputation, ());
    let client = ReputationClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.initialize(&admin);
    (client, admin)
}

#[test]
fn initialize_and_track_reviews() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let score = client.record_verified_review(&admin, &1u64, &5u32);
    assert_eq!(score.verified_reviews, 1);
    assert_eq!(score.average_rating_bps, 500);
    assert!(score.trust_score > 100);

    let score2 = client.record_verified_review(&admin, &1u64, &3u32);
    assert_eq!(score2.verified_reviews, 2);
    assert_eq!(score2.average_rating_bps, 400);
}

#[test]
fn completed_relationship_boosts_score() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);
    let before = client.ensure_tracked(&admin, &7u64);
    let after = client.record_completed_relationship(&admin, &7u64, &80u32);
    assert_eq!(after.completed_relationships, 1);
    assert!(after.trust_score > before.trust_score);
}

#[test]
fn dispute_lost_penalizes() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);
    let base = client.ensure_tracked(&admin, &3u64);
    let lost = client.record_dispute(&admin, &3u64, &true);
    assert_eq!(lost.disputes_lost, 1);
    assert!(lost.trust_score < base.trust_score);
}

#[test]
fn unauthorized_caller_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let stranger = Address::generate(&env);
    let result = client.try_record_verified_review(&stranger, &1u64, &5u32);
    assert_eq!(result, Err(Ok(Error::Unauthorized)));
}

#[test]
fn authorized_caller_can_update() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);
    let worker = Address::generate(&env);
    client.set_authorized(&worker, &true);
    let score = client.record_verified_review(&worker, &9u64, &4u32);
    assert_eq!(score.rating_sum, 4);
    assert_eq!(client.get_trust_score(&9u64), score.trust_score);
}

#[test]
fn invalid_rating_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);
    assert_eq!(
        client.try_record_verified_review(&admin, &1u64, &0u32),
        Err(Ok(Error::InvalidRating))
    );
    assert_eq!(
        client.try_record_verified_review(&admin, &1u64, &6u32),
        Err(Ok(Error::InvalidRating))
    );
}

#[test]
fn trust_score_capped_at_1000() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);
    for _ in 0..200 {
        client.record_verified_review(&admin, &42u64, &5u32);
    }
    assert_eq!(client.get_trust_score(&42u64), 1000);
}
