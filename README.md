# Blockchain-Based Real Estate Rental Management System

A comprehensive smart contract system built on the Stacks blockchain using Clarity language for managing real estate rental operations. This system provides a decentralized solution for property management, tenant screening, lease management, rent collection, and maintenance coordination.

## 🏗️ System Architecture

The system consists of five interconnected smart contracts:

### 1. Property Manager Verification Contract (`property-manager-verification.clar`)
- **Purpose**: Validates and manages property management companies
- **Key Features**:
    - Register property management companies
    - Verify company credentials and licenses
    - Admin-controlled verification process
    - Query verification status

### 2. Tenant Screening Contract (`tenant-screening.clar`)
- **Purpose**: Manages tenant screening and approval processes
- **Key Features**:
    - Submit tenant screening data (credit score, background check, income verification)
    - Approve/reject tenant applications
    - Track screening history
    - Property manager authorization system

### 3. Lease Management Contract (`lease-management.clar`)
- **Purpose**: Handles rental lease agreements and property occupancy
- **Key Features**:
    - Create new lease agreements
    - Track property occupancy status
    - Terminate and extend leases
    - Prevent double-booking of properties

### 4. Rent Collection Contract (`rent-collection.clar`)
- **Purpose**: Automates rent collection and payment tracking
- **Key Features**:
    - Schedule monthly rent payments
    - Process rent payments
    - Track payment history and late payments
    - Automated late fee calculation

### 5. Maintenance Coordination Contract (`maintenance-coordination.clar`)
- **Purpose**: Coordinates property maintenance requests and service providers
- **Key Features**:
    - Submit maintenance requests with priority levels
    - Approve and assign requests to service providers
    - Track request status from submission to completion
    - Service provider authorization system

## 🚀 Getting Started

### Prerequisites

- Stacks blockchain development environment
- Clarity language support
- Node.js (for running tests)
- Vitest testing framework

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd real-estate-rental-management
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

## 📋 Contract Functions

### Property Manager Verification

\`\`\`clarity
;; Register a new property manager
(register-manager (company-name (string-ascii 100)) (license-number (string-ascii 50)))

;; Verify a property manager (admin only)
(verify-manager (manager principal))

;; Check if manager is verified
(is-verified-manager (manager principal))
\`\`\`

### Tenant Screening

\`\`\`clarity
;; Submit tenant screening
(submit-screening (tenant principal) (property-id uint) (credit-score uint) (background-check bool) (income-verified bool))

;; Approve tenant application
(approve-tenant (tenant principal) (property-id uint))

;; Check approval status
(is-tenant-approved (tenant principal) (property-id uint))
\`\`\`

### Lease Management

\`\`\`clarity
;; Create new lease
(create-lease (property-id uint) (tenant principal) (landlord principal) (start-date uint) (end-date uint) (monthly-rent uint) (security-deposit uint))

;; Terminate lease
(terminate-lease (lease-id uint))

;; Extend lease
(extend-lease (lease-id uint) (new-end-date uint))
\`\`\`

### Rent Collection

\`\`\`clarity
;; Schedule rent payment
(schedule-rent (lease-id uint) (payment-period uint) (due-date uint))

;; Pay rent
(pay-rent (lease-id uint) (payment-period uint))

;; Check payment status
(is-rent-paid (lease-id uint) (payment-period uint))
\`\`\`

### Maintenance Coordination

\`\`\`clarity
;; Submit maintenance request
(submit-request (property-id uint) (description (string-utf8 500)) (priority uint))

;; Approve request (property manager only)
(approve-request (request-id uint))

;; Assign to service provider
(assign-request (request-id uint) (provider principal))

;; Complete request
(complete-request (request-id uint) (notes (string-utf8 500)))
\`\`\`

## 🔐 Security Features

- **Role-based Access Control**: Different permission levels for admins, property managers, tenants, and service providers
- **Data Validation**: Input validation for all contract functions
- **State Management**: Proper state transitions and validation
- **Error Handling**: Comprehensive error codes and messages

## 🧪 Testing

The system includes comprehensive test suites using Vitest:

- **Unit Tests**: Individual contract function testing
- **Integration Tests**: Cross-contract interaction testing
- **Edge Case Testing**: Boundary condition and error scenario testing

Run tests with:
\`\`\`bash
npm test
\`\`\`

## 📊 Error Codes

| Code | Description |
|------|-------------|
| u1   | Unauthorized access (admin only) |
| u2   | Unauthorized manager |
| u3   | Resource not found |
| u4   | Invalid lease |
| u5   | Inactive lease |
| u6   | Invalid status transition |
| u7   | Payment already processed |
| u8   | Not assigned provider |
| u9   | Invalid request status |

## 🔄 Workflow Examples

### Complete Rental Process

1. **Property Manager Registration**:
    - Admin registers property management company
    - Admin verifies company credentials

2. **Tenant Screening**:
    - Property manager submits tenant screening data
    - Manager approves qualified tenants

3. **Lease Creation**:
    - Create lease agreement for approved tenant
    - Property marked as occupied

4. **Rent Collection**:
    - Schedule monthly rent payments
    - Tenant pays rent through contract
    - Track payment history and late fees

5. **Maintenance Management**:
    - Tenant submits maintenance requests
    - Property manager approves and assigns to providers
    - Service provider completes work and updates status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 🔮 Future Enhancements

- Integration with external credit scoring APIs
- Automated rent collection with cryptocurrency
- IoT device integration for property monitoring
- Mobile application interface
- Multi-signature wallet support for large transactions
- Dispute resolution mechanism
- Insurance claim integration
