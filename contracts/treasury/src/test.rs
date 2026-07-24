#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup(env: &Env) -> (TreasuryClient, Address) {
    let contract_id = env.register(Treasury, ());
    let client = TreasuryClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.initialize(&admin);
    (client, admin)
}

#[test]
fn initialize_with_default_fees() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let fees = client.get_fees();
    assert!(fees.registration_fee > 0);
    assert!(fees.relationship_fee > 0);
    assert!(fees.review_fee > 0);
    assert_eq!(client.get_balance(), 0);
}

#[test]
fn deposit_and_withdraw() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let payer = Address::generate(&env);
    client.deposit(&payer, &1_000_000i128);
    assert_eq!(client.get_balance(), 1_000_000);
    let to = Address::generate(&env);
    client.withdraw(&to, &400_000i128);
    let stats = client.get_stats();
    assert_eq!(stats.balance, 600_000);
    assert_eq!(stats.total_withdrawn, 400_000);
}

#[test]
fn record_fee_from_authorized() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);
    let worker = Address::generate(&env);
    let payer = Address::generate(&env);
    client.set_authorized(&worker, &true);
    client.record_fee(
        &worker,
        &payer,
        &String::from_str(&env, "relationship"),
        &5_000_000i128,
    );
    assert_eq!(client.get_balance(), 5_000_000);
    assert_eq!(client.get_stats().fee_events, 1);
    // admin path
    client.record_fee(
        &admin,
        &payer,
        &String::from_str(&env, "review"),
        &1_000_000i128,
    );
    assert_eq!(client.get_balance(), 6_000_000);
}

#[test]
fn withdraw_insufficient_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let to = Address::generate(&env);
    assert_eq!(
        client.try_withdraw(&to, &1i128),
        Err(Ok(Error::InsufficientBalance))
    );
}

#[test]
fn unauthorized_fee_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let stranger = Address::generate(&env);
    let payer = Address::generate(&env);
    assert_eq!(
        client.try_record_fee(
            &stranger,
            &payer,
            &String::from_str(&env, "x"),
            &100i128
        ),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn set_fees() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    client.set_fees(&10i128, &20i128, &30i128);
    let fees = client.get_fees();
    assert_eq!(fees.registration_fee, 10);
    assert_eq!(fees.relationship_fee, 20);
    assert_eq!(fees.review_fee, 30);
}
