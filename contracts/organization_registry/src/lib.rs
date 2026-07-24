#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
    Vec,
};

#[contract]
pub struct OrganizationRegistry;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    OrgNotFound = 4,
    AlreadyRegistered = 5,
    AlreadyVerified = 6,
    InvalidName = 7,
    VendorAlreadyExists = 8,
    NotAnOrganization = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum OrgType {
    Business,
    Startup,
    Agency,
    Freelancer,
    Vendor,
    ServiceProvider,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
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

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Initialized,
    NextOrgId,
    Org(u64),
    OwnerIndex(Address),
    Vendor(u64, Address),
    OrgVendors(u64),
    TotalOrgs,
}

#[contractimpl]
impl OrganizationRegistry {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::NextOrgId, &1u64);
        env.storage().instance().set(&DataKey::TotalOrgs, &0u64);
        env.storage().instance().extend_ttl(100_000, 100_000);
        Ok(())
    }

    pub fn register_organization(
        env: Env,
        owner: Address,
        name: String,
        org_type: OrgType,
        metadata_uri: String,
    ) -> Result<u64, Error> {
        Self::require_init(&env)?;
        owner.require_auth();

        if name.len() < 2 || name.len() > 64 {
            return Err(Error::InvalidName);
        }
        if env
            .storage()
            .persistent()
            .has(&DataKey::OwnerIndex(owner.clone()))
        {
            return Err(Error::AlreadyRegistered);
        }

        let org_id: u64 = env.storage().instance().get(&DataKey::NextOrgId).unwrap();
        let org = Organization {
            id: org_id,
            owner: owner.clone(),
            name: name.clone(),
            org_type: org_type.clone(),
            metadata_uri,
            verified: false,
            registered_at: env.ledger().timestamp(),
            vendor_count: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Org(org_id), &org);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerIndex(owner.clone()), &org_id);
        env.storage()
            .persistent()
            .set(&DataKey::OrgVendors(org_id), &Vec::<Address>::new(&env));

        env.storage()
            .instance()
            .set(&DataKey::NextOrgId, &(org_id + 1));
        let total: u64 = env.storage().instance().get(&DataKey::TotalOrgs).unwrap();
        env.storage()
            .instance()
            .set(&DataKey::TotalOrgs, &(total + 1));

        env.events().publish(
            (Symbol::new(&env, "OrganizationRegistered"), org_id),
            (owner, name, org_type),
        );

        Ok(org_id)
    }

    pub fn verify_organization(env: Env, org_id: u64) -> Result<(), Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut org = Self::load_org(&env, org_id)?;
        if org.verified {
            return Err(Error::AlreadyVerified);
        }
        org.verified = true;
        env.storage()
            .persistent()
            .set(&DataKey::Org(org_id), &org);

        env.events().publish(
            (Symbol::new(&env, "OrganizationVerified"), org_id),
            (org.owner, true),
        );
        Ok(())
    }

    pub fn register_vendor(env: Env, org_id: u64, vendor: Address) -> Result<(), Error> {
        Self::require_init(&env)?;
        let mut org = Self::load_org(&env, org_id)?;
        org.owner.require_auth();

        let vendor_key = DataKey::Vendor(org_id, vendor.clone());
        if env.storage().persistent().has(&vendor_key) {
            return Err(Error::VendorAlreadyExists);
        }

        env.storage().persistent().set(&vendor_key, &true);
        let mut vendors: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::OrgVendors(org_id))
            .unwrap_or(Vec::new(&env));
        vendors.push_back(vendor.clone());
        env.storage()
            .persistent()
            .set(&DataKey::OrgVendors(org_id), &vendors);

        org.vendor_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Org(org_id), &org);

        env.events().publish(
            (symbol_short!("vend_reg"), org_id),
            vendor,
        );
        Ok(())
    }

    pub fn get_organization(env: Env, org_id: u64) -> Result<Organization, Error> {
        Self::require_init(&env)?;
        Self::load_org(&env, org_id)
    }

    pub fn get_org_by_owner(env: Env, owner: Address) -> Result<Organization, Error> {
        Self::require_init(&env)?;
        let org_id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerIndex(owner))
            .ok_or(Error::OrgNotFound)?;
        Self::load_org(&env, org_id)
    }

    pub fn is_verified(env: Env, org_id: u64) -> Result<bool, Error> {
        Self::require_init(&env)?;
        Ok(Self::load_org(&env, org_id)?.verified)
    }

    pub fn is_registered(env: Env, owner: Address) -> bool {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return false;
        }
        env.storage()
            .persistent()
            .has(&DataKey::OwnerIndex(owner))
    }

    pub fn get_vendors(env: Env, org_id: u64) -> Result<Vec<Address>, Error> {
        Self::require_init(&env)?;
        Self::load_org(&env, org_id)?;
        Ok(env
            .storage()
            .persistent()
            .get(&DataKey::OrgVendors(org_id))
            .unwrap_or(Vec::new(&env)))
    }

    pub fn total_organizations(env: Env) -> Result<u64, Error> {
        Self::require_init(&env)?;
        Ok(env.storage().instance().get(&DataKey::TotalOrgs).unwrap())
    }

    pub fn get_admin(env: Env) -> Result<Address, Error> {
        Self::require_init(&env)?;
        Ok(env.storage().instance().get(&DataKey::Admin).unwrap())
    }

    fn require_init(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        Ok(())
    }

    fn load_org(env: &Env, org_id: u64) -> Result<Organization, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Org(org_id))
            .ok_or(Error::OrgNotFound)
    }
}

mod test;
