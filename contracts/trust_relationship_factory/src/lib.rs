#![no_std]
use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, Address, Env, String,
    Symbol,
};

#[contract]
pub struct TrustRelationshipFactory;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    OrgNotFound = 4,
    OrgNotVerified = 5,
    SameParty = 6,
    InvalidTitle = 7,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Initialized,
    Registry,
    Relationship,
    Reputation,
    Treasury,
    CreatedIds,
    TotalCreated,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OrganizationView {
    pub id: u64,
    pub owner: Address,
    pub name: String,
    pub org_type: OrgTypeView,
    pub metadata_uri: String,
    pub verified: bool,
    pub registered_at: u64,
    pub vendor_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum OrgTypeView {
    Business,
    Startup,
    Agency,
    Freelancer,
    Vendor,
    ServiceProvider,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FeeConfigView {
    pub registration_fee: i128,
    pub relationship_fee: i128,
    pub review_fee: i128,
}

#[contractclient(name = "RegistryClient")]
pub trait RegistryTrait {
    fn get_organization(env: Env, org_id: u64) -> OrganizationView;
    fn is_verified(env: Env, org_id: u64) -> bool;
}

#[contractclient(name = "RelationshipClient")]
pub trait RelationshipTrait {
    fn create(
        env: Env,
        caller: Address,
        party_a: Address,
        party_b: Address,
        org_a: u64,
        org_b: u64,
        title: String,
    ) -> u64;
}

#[contractclient(name = "TreasuryClient")]
pub trait TreasuryTrait {
    fn get_fees(env: Env) -> FeeConfigView;
    fn record_fee(
        env: Env,
        caller: Address,
        payer: Address,
        fee_type: String,
        amount: i128,
    ) -> i128;
}

#[contractclient(name = "ReputationClient")]
pub trait ReputationTrait {
    fn ensure_tracked(
        env: Env,
        caller: Address,
        org_id: u64,
    ) -> ReputationScoreView;
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationScoreView {
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
impl TrustRelationshipFactory {
    pub fn initialize(
        env: Env,
        admin: Address,
        registry: Address,
        relationship: Address,
        reputation: Address,
        treasury: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage()
            .instance()
            .set(&DataKey::Relationship, &relationship);
        env.storage()
            .instance()
            .set(&DataKey::Reputation, &reputation);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::TotalCreated, &0u64);
        env.storage().instance().extend_ttl(100_000, 100_000);
        Ok(())
    }

    /// Create a business trust relationship after validating both organizations.
    pub fn create_relationship(
        env: Env,
        creator: Address,
        org_a: u64,
        org_b: u64,
        title: String,
    ) -> Result<u64, Error> {
        Self::require_init(&env)?;
        creator.require_auth();

        if org_a == org_b {
            return Err(Error::SameParty);
        }
        if title.len() < 3 || title.len() > 128 {
            return Err(Error::InvalidTitle);
        }

        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        let registry_client = RegistryClient::new(&env, &registry);

        let org_a_data = registry_client.get_organization(&org_a);
        let org_b_data = registry_client.get_organization(&org_b);

        // Creator must own one of the organizations
        if creator != org_a_data.owner && creator != org_b_data.owner {
            return Err(Error::Unauthorized);
        }

        let relationship_addr: Address =
            env.storage().instance().get(&DataKey::Relationship).unwrap();
        let this_contract = env.current_contract_address();
        let rel_client = RelationshipClient::new(&env, &relationship_addr);

        let rel_id = rel_client.create(
            &this_contract,
            &org_a_data.owner,
            &org_b_data.owner,
            &org_a,
            &org_b,
            &title,
        );

        // Ensure both orgs are tracked in reputation
        let reputation: Address = env.storage().instance().get(&DataKey::Reputation).unwrap();
        let rep_client = ReputationClient::new(&env, &reputation);
        rep_client.ensure_tracked(&this_contract, &org_a);
        rep_client.ensure_tracked(&this_contract, &org_b);

        // Record platform fee in treasury
        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let treasury_client = TreasuryClient::new(&env, &treasury);
        let fees = treasury_client.get_fees();
        treasury_client.record_fee(
            &this_contract,
            &creator,
            &String::from_str(&env, "relationship"),
            &fees.relationship_fee,
        );

        let total: u64 = env.storage().instance().get(&DataKey::TotalCreated).unwrap();
        env.storage()
            .instance()
            .set(&DataKey::TotalCreated, &(total + 1));

        env.events().publish(
            (Symbol::new(&env, "RelationshipCreated"), rel_id),
            (org_a, org_b, creator, title),
        );

        Ok(rel_id)
    }

    pub fn total_created(env: Env) -> Result<u64, Error> {
        Self::require_init(&env)?;
        Ok(env.storage().instance().get(&DataKey::TotalCreated).unwrap())
    }

    pub fn get_addresses(
        env: Env,
    ) -> Result<(Address, Address, Address, Address), Error> {
        Self::require_init(&env)?;
        Ok((
            env.storage().instance().get(&DataKey::Registry).unwrap(),
            env.storage()
                .instance()
                .get(&DataKey::Relationship)
                .unwrap(),
            env.storage().instance().get(&DataKey::Reputation).unwrap(),
            env.storage().instance().get(&DataKey::Treasury).unwrap(),
        ))
    }

    fn require_init(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        Ok(())
    }
}

mod test;
