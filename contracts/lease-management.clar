;; Lease Management Contract
;; This contract manages rental lease agreements

(define-data-var admin principal tx-sender)

;; Structure to represent a lease
(define-map leases uint
  {
    property-id: uint,
    tenant: principal,
    landlord: principal,
    start-date: uint,
    end-date: uint,
    monthly-rent: uint,
    security-deposit: uint,
    active: bool
  }
)

;; Counter for lease IDs
(define-data-var lease-id-counter uint u1)

;; Map to track property occupancy
(define-map property-occupancy uint principal)

;; Map to store authorized property managers
(define-map authorized-managers principal bool)

;; Public function to authorize a property manager
(define-public (authorize-manager (manager principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (map-set authorized-managers manager true))
  )
)

;; Public function to create a new lease
(define-public (create-lease (property-id uint) (tenant principal) (landlord principal)
                            (start-date uint) (end-date uint) (monthly-rent uint) (security-deposit uint))
  (let ((new-lease-id (var-get lease-id-counter)))
    (begin
      (asserts! (or (is-eq tx-sender (var-get admin))
                   (default-to false (map-get? authorized-managers tx-sender)))
               (err u2))
      (asserts! (is-none (map-get? property-occupancy property-id)) (err u3)) ;; Property must be vacant
      (var-set lease-id-counter (+ new-lease-id u1))
      (map-set property-occupancy property-id tenant)
      (ok (map-set leases new-lease-id
        {
          property-id: property-id,
          tenant: tenant,
          landlord: landlord,
          start-date: start-date,
          end-date: end-date,
          monthly-rent: monthly-rent,
          security-deposit: security-deposit,
          active: true
        }
      ))
    )
  )
)

;; Public function to terminate a lease
(define-public (terminate-lease (lease-id uint))
  (let ((lease (unwrap! (map-get? leases lease-id) (err u4))))
    (begin
      (asserts! (or (is-eq tx-sender (var-get admin))
                   (is-eq tx-sender (get landlord lease))
                   (default-to false (map-get? authorized-managers tx-sender)))
               (err u2))
      (map-delete property-occupancy (get property-id lease))
      (ok (map-set leases lease-id
        (merge lease { active: false })
      ))
    )
  )
)

;; Public function to extend a lease
(define-public (extend-lease (lease-id uint) (new-end-date uint))
  (let ((lease (unwrap! (map-get? leases lease-id) (err u4))))
    (begin
      (asserts! (or (is-eq tx-sender (var-get admin))
                   (is-eq tx-sender (get landlord lease))
                   (default-to false (map-get? authorized-managers tx-sender)))
               (err u2))
      (asserts! (get active lease) (err u5)) ;; Lease must be active
      (ok (map-set leases lease-id
        (merge lease { end-date: new-end-date })
      ))
    )
  )
)

;; Read-only function to get lease details
(define-read-only (get-lease-details (lease-id uint))
  (map-get? leases lease-id)
)

;; Read-only function to check if a property is occupied
(define-read-only (is-property-occupied (property-id uint))
  (is-some (map-get? property-occupancy property-id))
)

;; Read-only function to get tenant for a property
(define-read-only (get-property-tenant (property-id uint))
  (map-get? property-occupancy property-id)
)
