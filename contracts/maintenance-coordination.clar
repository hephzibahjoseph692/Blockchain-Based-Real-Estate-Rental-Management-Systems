;; Maintenance Coordination Contract
;; This contract coordinates property maintenance

(define-data-var admin principal tx-sender)

;; Status enum: 0=Pending, 1=Approved, 2=In Progress, 3=Completed, 4=Rejected
(define-data-var request-id-counter uint u1)

;; Structure to track maintenance requests
(define-map maintenance-requests uint
  {
    property-id: uint,
    tenant: principal,
    description: (string-utf8 500),
    priority: uint, ;; 1=Low, 2=Medium, 3=High, 4=Emergency
    status: uint,
    created-at: uint,
    updated-at: uint,
    assigned-to: (optional principal),
    completion-notes: (optional (string-utf8 500))
  }
)

;; Map to store property managers for properties
(define-map property-managers uint principal)

;; Map to store authorized service providers
(define-map authorized-providers principal bool)

;; Public function to set property manager
(define-public (set-property-manager (property-id uint) (manager principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (map-set property-managers property-id manager))
  )
)

;; Public function to authorize service provider
(define-public (authorize-provider (provider principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (map-set authorized-providers provider true))
  )
)

;; Public function to submit maintenance request
(define-public (submit-request (property-id uint) (description (string-utf8 500)) (priority uint))
  (let ((new-request-id (var-get request-id-counter)))
    (begin
      ;; In a real implementation, we would verify the tenant is associated with the property
      (asserts! (<= priority u4) (err u2)) ;; Valid priority range
      (var-set request-id-counter (+ new-request-id u1))
      (ok (map-set maintenance-requests new-request-id
        {
          property-id: property-id,
          tenant: tx-sender,
          description: description,
          priority: priority,
          status: u0, ;; Pending
          created-at: block-height,
          updated-at: block-height,
          assigned-to: none,
          completion-notes: none
        }
      ))
    )
  )
)

;; Public function to approve maintenance request
(define-public (approve-request (request-id uint))
  (let ((request (unwrap! (map-get? maintenance-requests request-id) (err u3)))
        (property-manager (unwrap! (map-get? property-managers (get property-id request)) (err u4))))
    (begin
      (asserts! (is-eq tx-sender property-manager) (err u5)) ;; Only property manager can approve
      (asserts! (is-eq (get status request) u0) (err u6)) ;; Request must be pending
      (ok (map-set maintenance-requests request-id
        (merge request
          {
            status: u1, ;; Approved
            updated-at: block-height
          }
        )
      ))
    )
  )
)

;; Public function to assign maintenance request
(define-public (assign-request (request-id uint) (provider principal))
  (let ((request (unwrap! (map-get? maintenance-requests request-id) (err u3)))
        (property-manager (unwrap! (map-get? property-managers (get property-id request)) (err u4))))
    (begin
      (asserts! (is-eq tx-sender property-manager) (err u5)) ;; Only property manager can assign
      (asserts! (is-eq (get status request) u1) (err u6)) ;; Request must be approved
      (asserts! (default-to false (map-get? authorized-providers provider)) (err u7)) ;; Provider must be authorized
      (ok (map-set maintenance-requests request-id
        (merge request
          {
            status: u2, ;; In Progress
            updated-at: block-height,
            assigned-to: (some provider)
          }
        )
      ))
    )
  )
)

;; Public function to complete maintenance request
(define-public (complete-request (request-id uint) (notes (string-utf8 500)))
  (let ((request (unwrap! (map-get? maintenance-requests request-id) (err u3))))
    (begin
      (asserts! (is-eq (some tx-sender) (get assigned-to request)) (err u8)) ;; Only assigned provider can complete
      (asserts! (is-eq (get status request) u2) (err u9)) ;; Request must be in progress
      (ok (map-set maintenance-requests request-id
        (merge request
          {
            status: u3, ;; Completed
            updated-at: block-height,
            completion-notes: (some notes)
          }
        )
      ))
    )
  )
)

;; Read-only function to get request details
(define-read-only (get-request-details (request-id uint))
  (map-get? maintenance-requests request-id)
)

;; Read-only function to get property manager
(define-read-only (get-property-manager (property-id uint))
  (map-get? property-managers property-id)
)
