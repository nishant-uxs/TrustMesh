#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup(env: &Env) -> (OrganizationRegistryClient, Address) {
    let contract_id = env.register(OrganizationRegistry, ());
    let client = OrganizationRegistryClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.initialize(&admin);
    (client, admin)
}

#[test]
fn initialize_and_register() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);

    let id = client.register_organization(
        &owner,
        &String::from_str(&env, "Acme Corp"),
        &OrgType::Business,
        &String::from_str(&env, "ipfs://acme"),
    );
    assert_eq!(id, 1);

    let org = client.get_organization(&id);
    assert_eq!(org.name, String::from_str(&env, "Acme Corp"));
    assert!(!org.verified);
    assert_eq!(client.total_organizations(), 1);
}

#[test]
fn verify_organization_emits_and_flags() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin) = setup(&env);
    let owner = Address::generate(&env);
    let id = client.register_organization(
        &owner,
        &String::from_str(&env, "Verified Co"),
        &OrgType::Startup,
        &String::from_str(&env, "ipfs://v"),
    );
    client.verify_organization(&id);
    assert!(client.is_verified(&id));
}

#[test]
fn reject_duplicate_owner_registration() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    client.register_organization(
        &owner,
        &String::from_str(&env, "First"),
        &OrgType::Agency,
        &String::from_str(&env, "ipfs://1"),
    );
    let result = client.try_register_organization(
        &owner,
        &String::from_str(&env, "Second"),
        &OrgType::Agency,
        &String::from_str(&env, "ipfs://2"),
    );
    assert_eq!(result, Err(Ok(Error::AlreadyRegistered)));
}

#[test]
fn register_vendor() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let vendor = Address::generate(&env);
    let id = client.register_organization(
        &owner,
        &String::from_str(&env, "Vendor Hub"),
        &OrgType::Vendor,
        &String::from_str(&env, "ipfs://vh"),
    );
    client.register_vendor(&id, &vendor);
    let vendors = client.get_vendors(&id);
    assert_eq!(vendors.len(), 1);
    assert_eq!(client.get_organization(&id).vendor_count, 1);
}

#[test]
fn get_org_by_owner() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let id = client.register_organization(
        &owner,
        &String::from_str(&env, "Owner Org"),
        &OrgType::Freelancer,
        &String::from_str(&env, "ipfs://o"),
    );
    let org = client.get_org_by_owner(&owner);
    assert_eq!(org.id, id);
    assert!(client.is_registered(&owner));
}

#[test]
fn reject_short_name() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let result = client.try_register_organization(
        &owner,
        &String::from_str(&env, "A"),
        &OrgType::Business,
        &String::from_str(&env, "ipfs://x"),
    );
    assert_eq!(result, Err(Ok(Error::InvalidName)));
}
