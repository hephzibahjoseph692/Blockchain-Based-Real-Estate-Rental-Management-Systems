import { describe, it, expect, beforeEach } from "vitest"

// Mock implementation for testing Clarity contracts
const mockContract = () => {
  const admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  const authorizedManagers = new Map()
  const leases = new Map()
  const propertyOccupancy = new Map()
  let leaseIdCounter = 1
  
  return {
    authorizeManager: (sender: string, manager: string) => {
      if (sender !== admin) {
        return { error: 1 }
      }
      
      authorizedManagers.set(manager, true)
      return { success: true }
    },
    createLease: (
        sender: string,
        propertyId: number,
        tenant: string,
        landlord: string,
        startDate: number,
        endDate: number,
        monthlyRent: number,
        securityDeposit: number,
    ) => {
      if (sender !== admin && !authorizedManagers.get(sender)) {
        return { error: 2 }
      }
      
      if (propertyOccupancy.has(propertyId)) {
        return { error: 3 }
      }
      
      const leaseId = leaseIdCounter++
      leases.set(leaseId, {
        propertyId,
        tenant,
        landlord,
        startDate,
        endDate,
        monthlyRent,
        securityDeposit,
        active: true,
      })
      
      propertyOccupancy.set(propertyId, tenant)
      return { success: true, leaseId }
    },
    terminateLease: (sender: string, leaseId: number) => {
      if (!leases.has(leaseId)) {
        return { error: 4 }
      }
      
      const lease = leases.get(leaseId)
      if (sender !== admin && sender !== lease.landlord && !authorizedManagers.get(sender)) {
        return { error: 2 }
      }
      
      propertyOccupancy.delete(lease.propertyId)
      leases.set(leaseId, {
        ...lease,
        active: false,
      })
      
      return { success: true }
    },
    extendLease: (sender: string, leaseId: number, newEndDate: number) => {
      if (!leases.has(leaseId)) {
        return { error: 4 }
      }
      
      const lease = leases.get(leaseId)
      if (sender !== admin && sender !== lease.landlord && !authorizedManagers.get(sender)) {
        return { error: 2 }
      }
      
      if (!lease.active) {
        return { error: 5 }
      }
      
      leases.set(leaseId, {
        ...lease,
        endDate: newEndDate,
      })
      
      return { success: true }
    },
    getLeaseDetails: (leaseId: number) => {
      if (!leases.has(leaseId)) {
        return null
      }
      return leases.get(leaseId)
    },
    isPropertyOccupied: (propertyId: number) => {
      return propertyOccupancy.has(propertyId)
    },
    getPropertyTenant: (propertyId: number) => {
      return propertyOccupancy.get(propertyId) || null
    },
  }
}

describe("Lease Management Contract", () => {
  let contract
  
  beforeEach(() => {
    contract = mockContract()
  })
  
  it("should create a lease", () => {
    const admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const tenant = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const landlord = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    const result = contract.createLease(
        admin,
        1, // propertyId
        tenant,
        landlord,
        100, // startDate
        200, // endDate
        1000, // monthlyRent
        2000, // securityDeposit
    )
    
    expect(result.success).toBe(true)
    expect(result.leaseId).toBe(1)
    
    const lease = contract.getLeaseDetails(1)
    expect(lease).not.toBeNull()
    expect(lease.propertyId).toBe(1)
    expect(lease.tenant).toBe(tenant)
    expect(lease.landlord).toBe(landlord)
    expect(lease.monthlyRent).toBe(1000)
    expect(lease.active).toBe(true)
    
    const isOccupied = contract.isPropertyOccupied(1)
    expect(isOccupied).toBe(true)
    
    const propertyTenant = contract.getPropertyTenant(1)
    expect(propertyTenant).toBe(tenant)
  })
  
  it("should not create lease for occupied property", () => {
    const admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const tenant1 = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const tenant2 = "ST4PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const landlord = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    contract.createLease(
        admin,
        1, // propertyId
        tenant1,
        landlord,
        100, // startDate
        200, // endDate
        1000, // monthlyRent
        2000, // securityDeposit
    )
    
    const result = contract.createLease(
        admin,
        1, // propertyId - same property
        tenant2,
        landlord,
        100, // startDate
        200, // endDate
        1000, // monthlyRent
        2000, // securityDeposit
    )
    
    expect(result.error).toBe(3)
  })
  
  it("should terminate a lease", () => {
    const admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const tenant = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const landlord = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    const createResult = contract.createLease(
        admin,
        1, // propertyId
        tenant,
        landlord,
        100, // startDate
        200, // endDate
        1000, // monthlyRent
        2000, // securityDeposit
    )
    
    const terminateResult = contract.terminateLease(landlord, createResult.leaseId)
    expect(terminateResult.success).toBe(true)
    
    const lease = contract.getLeaseDetails(createResult.leaseId)
    expect(lease.active).toBe(false)
    
    const isOccupied = contract.isPropertyOccupied(1)
    expect(isOccupied).toBe(false)
  })
  
  it("should extend a lease", () => {
    const admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const tenant = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const landlord = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    const createResult = contract.createLease(
        admin,
        1, // propertyId
        tenant,
        landlord,
        100, // startDate
        200, // endDate
        1000, // monthlyRent
        2000, // securityDeposit
    )
    
    const extendResult = contract.extendLease(landlord, createResult.leaseId, 300)
    expect(extendResult.success).toBe(true)
    
    const lease = contract.getLeaseDetails(createResult.leaseId)
    expect(lease.endDate).toBe(300)
  })
})
