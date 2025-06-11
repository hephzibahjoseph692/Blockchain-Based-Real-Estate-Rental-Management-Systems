import { describe, it, expect, beforeEach } from "vitest"

// Mock implementation for testing Clarity contracts
const mockContract = () => {
  const admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  const propertyManagers = new Map()
  const authorizedProviders = new Map()
  const maintenanceRequests = new Map()
  let requestIdCounter = 1
  let currentBlockHeight = 100
  
  return {
    setBlockHeight: (height: number) => {
      currentBlockHeight = height
    },
    getBlockHeight: () => currentBlockHeight,
    setPropertyManager: (sender: string, propertyId: number, manager: string) => {
      if (sender !== admin) {
        return { error: 1 }
      }
      
      propertyManagers.set(propertyId, manager)
      return { success: true }
    },
    authorizeProvider: (sender: string, provider: string) => {
      if (sender !== admin) {
        return { error: 1 }
      }
      
      authorizedProviders.set(provider, true)
      return { success: true }
    },
    submitRequest: (sender: string, propertyId: number, description: string, priority: number) => {
      if (priority > 4) {
        return { error: 2 }
      }
      
      const requestId = requestIdCounter++
      maintenanceRequests.set(requestId, {
        propertyId,
        tenant: sender,
        description,
        priority,
        status: 0, // Pending
        createdAt: currentBlockHeight,
        updatedAt: currentBlockHeight,
        assignedTo: null,
        completionNotes: null,
      })
      
      return { success: true, requestId }
    },
    approveRequest: (sender: string, requestId: number) => {
      if (!maintenanceRequests.has(requestId)) {
        return { error: 3 }
      }
      
      const request = maintenanceRequests.get(requestId)
      if (!propertyManagers.has(request.propertyId)) {
        return { error: 4 }
      }
      
      if (sender !== propertyManagers.get(request.propertyId)) {
        return { error: 5 }
      }
      
      if (request.status !== 0) {
        return { error: 6 }
      }
      
      maintenanceRequests.set(requestId, {
        ...request,
        status: 1, // Approved
        updatedAt: currentBlockHeight,
      })
      
      return { success: true }
    },
    assignRequest: (sender: string, requestId: number, provider: string) => {
      if (!maintenanceRequests.has(requestId)) {
        return { error: 3 }
      }
      
      const request = maintenanceRequests.get(requestId)
      if (!propertyManagers.has(request.propertyId)) {
        return { error: 4 }
      }
      
      if (sender !== propertyManagers.get(request.propertyId)) {
        return { error: 5 }
      }
      
      if (request.status !== 1) {
        return { error: 6 }
      }
      
      if (!authorizedProviders.get(provider)) {
        return { error: 7 }
      }
      
      maintenanceRequests.set(requestId, {
        ...request,
        status: 2, // In Progress
        updatedAt: currentBlockHeight,
        assignedTo: provider,
      })
      
      return { success: true }
    },
    completeRequest: (sender: string, requestId: number, notes: string) => {
      if (!maintenanceRequests.has(requestId)) {
        return { error: 3 }
      }
      
      const request = maintenanceRequests.get(requestId)
      if (request.assignedTo !== sender) {
        return { error: 8 }
      }
      
      if (request.status !== 2) {
        return { error: 9 }
      }
      
      maintenanceRequests.set(requestId, {
        ...request,
        status: 3, // Completed
        updatedAt: currentBlockHeight,
        completionNotes: notes,
      })
      
      return { success: true }
    },
    getRequestDetails: (requestId: number) => {
      if (!maintenanceRequests.has(requestId)) {
        return null
      }
      return maintenanceRequests.get(requestId)
    },
    getPropertyManager: (propertyId: number) => {
      return propertyManagers.get(propertyId) || null
    },
  }
}

describe('Maintenance Coordination Contract', () => {
  let contract;
  
  beforeEach(() => {
    contract = mockContract();
  });
  
  it('should set property manager', () => {
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const manager = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    const result = contract.setPropertyManager(
        admin,
        1, // propertyId
        manager
    );
    
    expect(result.success).toBe(true);
    
    const propertyManager = contract.getPropertyManager(1);
    expect(propertyManager).toBe(manager);
  });
  
  it('should authorize service provider', () => {
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const provider = 'ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    const result = contract.authorizeProvider(admin, provider);
    expect(result.success).toBe(true);
  });
  
  it('should submit maintenance request', () => {
    const tenant = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    const result = contract.submitRequest(
        tenant,
        1, // propertyId
        'Leaking faucet in kitchen',
        2 // Medium priority
    );
    
    expect(result.success).toBe(true);
    expect(result.requestId).toBe(1);
    
    const request = contract.getRequestDetails(1);
    expect(request).not.toBeNull();
    expect(request.propertyId).toBe(1);
    expect(request.tenant).toBe(tenant);
    expect(request.description).toBe('Leaking faucet in kitchen');
    expect(request.priority).toBe(2);
    expect(request.status).toBe(0); // Pending
  });
  
  it('should approve maintenance request', () => {
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const tenant = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const manager = 'ST4PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    contract.setPropertyManager(admin, 1, manager);
    
    const submitResult = contract.submitRequest(
        tenant,
        1, // propertyId
        'Leaking faucet in kitchen',
        2 // Medium priority
    );
    
    const approveResult = contract.approveRequest(manager, submitResult.requestId);
    expect(approveResult.success).toBe(true);
    
    const request = contract.getRequestDetails(submitResult.requestId);
    expect(request.status).toBe(1); // Approved
  });
  
  it('should assign maintenance request to provider', () => {
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const tenant = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const manager = 'ST4PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const provider = 'ST5PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    contract.setPropertyManager(admin, 1, manager);
    contract.authorizeProvider(admin, provider);
    
    const submitResult = contract.submitRequest(
        tenant,
        1, // propertyId
        'Leaking faucet in kitchen',
        2 // Medium priority
    );
    
    contract.approveRequest(manager, submitResult.requestId);
    
    const assignResult = contract.assignRequest(manager, submitResult.requestId, provider);
    expect(assignResult.success).toBe(true);
    
    const request = contract.getRequestDetails(submitResult.requestId);
    expect(request.status).toBe(2); // In Progress
    expect(request.assignedTo).toBe(provider);
  });
  
  it('should complete maintenance request', () => {
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const tenant = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const manager = 'ST4PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const provider = 'ST5PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    contract.setPropertyManager(admin, 1, manager);
    contract.authorizeProvider(admin, provider);
    
    const submitResult = contract.submitRequest(
        tenant,
        1, // propertyId
        'Leaking faucet in kitchen',
        2 // Medium priority
    );
    
    contract.approveRequest(manager, submitResult.requestId);
    contract.assignRequest(manager, submitResult.requestId, provider);
    
    const completeResult = contract.completeRequest(
        provider,
        submitResult.requestId,
        'Replaced washer and fixed leak. All working properly now.'
    );
    
    expect(completeResult.success).toBe(true);
    
    const request = contract.getRequestDetails(submitResult.requestId);
    expect(request.status).toBe(3); // Completed
    expect(request.completionNotes).toBe('Replaced washer and fixed leak. All working properly now.');
  });
  
  it('should not allow non-assigned provider to complete request', () => {
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';\
    const tenant = 'ST2PQHQK
