#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, String,
};

fn setup(env: &Env) -> (TreasuryClient<'_>, Address) {
    let contract_id = env.register(Treasury, ());
    let client = TreasuryClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.initialize(&admin);
    (client, admin)
}

fn setup_with_token(
    env: &Env,
) -> (TreasuryClient<'_>, Address, Address, StellarAssetClient<'_>) {
    let (treasury, admin) = setup(env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    treasury.set_token(&token_addr);
    let asset = StellarAssetClient::new(env, &token_addr);
    (treasury, admin, token_addr, asset)
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
fn deposit_and_withdraw_accounting() {
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
fn deposit_and_withdraw_with_token() {
    let env = Env::default();
    env.mock_all_auths();
    let (treasury, _, token_addr, asset) = setup_with_token(&env);
    let payer = Address::generate(&env);
    let recipient = Address::generate(&env);
    asset.mint(&payer, &5_000_000i128);

    treasury.deposit(&payer, &2_000_000i128);
    assert_eq!(treasury.get_balance(), 2_000_000);

    let token = TokenClient::new(&env, &token_addr);
    assert_eq!(token.balance(&treasury.address), 2_000_000);
    assert_eq!(token.balance(&payer), 3_000_000);

    treasury.withdraw(&recipient, &500_000i128);
    assert_eq!(treasury.get_balance(), 1_500_000);
    assert_eq!(token.balance(&recipient), 500_000);
    assert_eq!(token.balance(&treasury.address), 1_500_000);
}

#[test]
fn record_fee_pulls_token_from_payer() {
    let env = Env::default();
    env.mock_all_auths();
    let (treasury, admin, token_addr, asset) = setup_with_token(&env);
    let worker = Address::generate(&env);
    let payer = Address::generate(&env);
    treasury.set_authorized(&worker, &true);
    asset.mint(&payer, &10_000_000i128);

    treasury.record_fee(
        &worker,
        &payer,
        &String::from_str(&env, "relationship"),
        &5_000_000i128,
    );
    assert_eq!(treasury.get_balance(), 5_000_000);
    let token = TokenClient::new(&env, &token_addr);
    assert_eq!(token.balance(&treasury.address), 5_000_000);
    assert_eq!(token.balance(&payer), 5_000_000);
    let _ = admin;
}

#[test]
fn skim_fees_to_collector() {
    let env = Env::default();
    env.mock_all_auths();
    let (treasury, admin, token_addr, asset) = setup_with_token(&env);
    let collector = Address::generate(&env);
    let payer = Address::generate(&env);
    treasury.set_fee_collector(&collector);
    asset.mint(&payer, &3_000_000i128);
    treasury.deposit(&payer, &3_000_000i128);
    treasury.skim_fees(&1_000_000i128);

    let token = TokenClient::new(&env, &token_addr);
    assert_eq!(token.balance(&collector), 1_000_000);
    assert_eq!(treasury.get_balance(), 2_000_000);
    let _ = admin;
}

#[test]
fn skim_without_token_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    client.deposit(&Address::generate(&env), &100i128);
    assert_eq!(client.try_skim_fees(&50i128), Err(Ok(Error::TokenNotSet)));
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
