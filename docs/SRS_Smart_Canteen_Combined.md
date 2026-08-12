# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## SMART CANTEEN AUTOMATED FOOD SERVING ECOSYSTEM (FRONTEND)

---

### Definition and Acronyms

| Acronym   | Definition                         |
| :-------- | :--------------------------------- |
| **API**   | Application Programming Interface  |
| **BR**    | Business Rule                      |
| **CDM**   | Conceptual Data Modeling           |
| **CRUD**  | Create, Read, Update, Delete       |
| **DTO**   | Data Transfer Object               |
| **IDE**   | Integrated Development Environment |
| **IoT**   | Internet of Things                 |
| **IPN**   | Instant Payment Notification       |
| **JWT**   | JSON Web Token                     |
| **OTP**   | One-Time Password                  |
| **QR**    | Quick Response Code                |
| **RFID**  | Radio-Frequency Identification     |
| **SRS**   | Software Requirement Specification |
| **UAT**   | User Acceptance Test               |
| **UI/UX** | User Interface / User Experience   |

---

## I. Project Introduction

### 1. Overview

Smart Canteen is an automated food pre-ordering and serving ecosystem designed for university campuses. The platform connects Students, Kitchen Staff, Canteen Managers, and System Administrators with automated IoT hardware including RFID Trays, Automated Pickup Slots, and Robotic Arms. The frontend web application is constructed using **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui**, **Zustand**, and **React Query**.

### 2. Product Background

Traditional campus canteens suffer from heavy peak-hour crowding, long queuing times, manual order sorting errors, and inefficient payment handling. Students waste significant break time waiting for meals, while canteen staff struggle with unpredictable demand surges and manual inventory tracking.

Smart Canteen resolves these operational bottlenecks by providing pre-ordering by meal sessions (Breakfast, Lunch, Dinner), cashless wallet payment integration, real-time order tracking, automated kitchen tray assembly queues, robotic tray delivery to pickup slots, and automated refund management.

### 3. Existing Systems

- **ShopeeFood / GrabFood**: Designed for external delivery services with high delivery fees, variable delivery times, and lack of integration with campus hardware or fixed meal session windows.
- **Traditional Canteen Cash Registers**: Require physical queueing, cash transactions, and manual food delivery with zero real-time inventory visibility or automated refund handling.

### 4. Business Opportunity

Smart Canteen delivers a frictionless campus dining experience that eliminates waiting lines, reduces kitchen food waste through session-based pre-ordering, automates hardware dispatch, and ensures 100% financial auditability through digital wallet transactions.

### 5. Software Product Vision

For students needing fast, reliable meal pickup and canteen staff requiring efficient serving operations, Smart Canteen is an automated IoT-enabled web application that provides session pre-ordering, instant wallet payments, live tray packing status, QR/OTP pickup verification, and hardware monitoring.

### 6. Project Scope & Limitations

- **FE-01**: User authentication (Email/Password & Google OAuth2), student identity card verification, profile management.
- **FE-02**: Meal session selection, menu category browsing, live dish stock tracking, nutritional modal details.
- **FE-03**: Shopping cart management, meal session reservation, multi-gateway payment (Smart Canteen Wallet, VNPAY, PayOS).
- **FE-04**: Real-time order tracking with QR Code and OTP pickup credentials generation.
- **FE-05**: Smart Canteen digital wallet top-up, balance management, transaction history tracking.
- **FE-06**: Refund request management with policy selection, proof image upload, and manager review.
- **FE-07**: Dish change proposal notifications handling for out-of-stock item substitutions (`SwapItem`, `RefundItem`, `RefundOrder`).
- **FE-08**: Manager dashboard for session finalization, menu CRUD, refund approvals, and hardware controls (Robot Arms, RFID Trays, Pickup Slots).
- **FE-09**: Staff live serving queue, tray assembly confirmation, shelf stock updates, and manual slot binding.
- **FE-10**: System Admin dashboard, student identity verification approvals, system audit logs.

---

## II. Software Requirement Specification (SRS)

### 1. Product Overview

Smart Canteen connects 4 primary system roles into a unified web application:

```
+-----------------------------------------------------------------------+
|                         SMART CANTEEN SYSTEM                          |
+-----------------------------------------------------------------------+
|  STUDENT / CUSTOMER  |     CANTEEN MANAGER     |     KITCHEN STAFF    |
|  - Pre-order Meals   |  - Session Finalize     |  - Serving Queue     |
|  - Wallet & Pay      |  - Menu & Stock CRUD    |  - Tray Packing      |
|  - QR/OTP Pickup     |  - Refund Approval      |  - Shelf Stock Update|
|  - Request Refund    |  - Hardware Control     |  - Change Proposals  |
+-----------------------------------------------------------------------+
|                         SYSTEM ADMINISTRATOR                          |
|  - Health Metrics    | - Verification Approvals|  - Audit Logs Monitoring |
+-----------------------------------------------------------------------+
```

---

### 2. User Requirements

#### 2.1 Actors

| #     | Actor                  | Description                                                                                                                                                                              |
| :---- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Student / Customer** | Primary user who browses menus, places session pre-orders, pays via wallet/gateways, retrieves meals using QR/OTP codes, and requests refunds.                                           |
| **2** | **Manager**            | Operational administrator responsible for managing meal sessions, configuring menu items, approving refunds, managing users, and controlling hardware (Robot Arms, Trays, Pickup Slots). |
| **3** | **Staff**              | Kitchen operational staff who monitor live order queues, pack dishes onto RFID trays, update shelf inventory, issue change proposals, and bind pickup slots manually.                    |
| **4** | **System Admin**       | System owner who monitors platform health metrics, reviews student identity verification submissions, and inspects system audit logs.                                                    |

#### 2.2 Use Cases List

| ID        | Use Case Name             | Primary Actor | Description                                                       |
| :-------- | :------------------------ | :------------ | :---------------------------------------------------------------- |
| **UC-01** | Login & Authentication    | All Actors    | Authenticate using Email/Password or Google OAuth2.               |
| **UC-02** | Register Student Account  | Student       | Create a new student account with validation.                     |
| **UC-03** | Verify Email & Identity   | Student       | Submit 6-digit OTP code and upload student card photo.            |
| **UC-04** | Forgot & Reset Password   | Student       | Request password reset token via email and set new password.      |
| **UC-05** | Browse Menu & Sessions    | Student       | View dishes grouped by meal sessions and filter by category.      |
| **UC-06** | Manage Shopping Cart      | Student       | Adjust item quantities, select session, and verify total price.   |
| **UC-07** | Checkout & Pay Order      | Student       | Select payment method (Wallet, VNPAY, PayOS) and place order.     |
| **UC-08** | Track Order & Pickup      | Student       | View real-time order status and display QR/OTP pickup code.       |
| **UC-09** | Top up Wallet             | Student       | Add funds to Smart Canteen wallet via VNPAY / PayOS gateways.     |
| **UC-10** | Request Order Refund      | Student       | Submit refund claim with policy code selection and proof photos.  |
| **UC-11** | Respond Change Proposal   | Student       | Accept dish substitution, request item refund, or cancel order.   |
| **UC-12** | Update User Profile       | Student       | Edit personal profile details and upload avatar / student card.   |
| **UC-13** | Manage Meal Sessions      | Manager       | Create, edit, lock orders, and finalize meal sessions.            |
| **UC-14** | Manage Menu & Dishes      | Manager       | Full CRUD for dish categories, dish pricing, and kitchen stock.   |
| **UC-15** | Approve Refund Request    | Manager       | Approve or reject student refund claims with rejection feedback.  |
| **UC-16** | Control System Hardware   | Manager       | Manage Robot Arms, RFID Trays, Pickup Slots, and Slot configs.    |
| **UC-17** | Manage User Accounts      | Manager       | Suspend, ban, or reactivate student and staff accounts.           |
| **UC-18** | Counter Verification      | Manager       | Verify OTP pickup codes manually at canteen counter.              |
| **UC-19** | Process Serving Queue     | Staff         | View live packing queue and confirm tray assembly complete.       |
| **UC-20** | Update Shelf Stock        | Staff         | Update physical shelf dish portion counts in real time.           |
| **UC-21** | Issue Change Proposal     | Staff         | Create substitution proposal when ordered dish runs out of stock. |
| **UC-22** | Bind Pickup Slot          | Staff         | Manually link tray to pickup slot during hardware bypass.         |
| **UC-23** | Approve Student Verify    | Admin         | Inspect student ID photos and approve/reject verification status. |
| **UC-24** | Monitor System Audit Logs | Admin         | Search and review full system operation audit logs.               |

---

### 3. Functional Requirements

#### 3.1 System Functional Overview

##### 3.1.1 Screen Authorization Matrix

| Screen / Feature Route                                                               | Student | Manager | Staff | Admin |
| :----------------------------------------------------------------------------------- | :-----: | :-----: | :---: | :---: |
| `/login`, `/register`, `/forgot-password`, `/reset-password`                         |    X    |    X    |   X   |   X   |
| `/verify-email`, `/verification`                                                     |    X    |    -    |   -   |   -   |
| `/session`, `/menu`                                                                  |    X    |    X    |   X   |   X   |
| `/cart`, `/checkout`                                                                 |    X    |    -    |   -   |   -   |
| `/orders`, `/orders/[id]`                                                            |    X    |    -    |   -   |   -   |
| `/wallet`, `/wallet/transactions`                                                    |    X    |    -    |   -   |   -   |
| `/refund`, `/change-proposals`                                                       |    X    |    -    |   -   |   -   |
| `/profile`                                                                           |    X    |    X    |   X   |   X   |
| `/manager`, `/manager/reports`                                                       |    -    |    X    |   -   |   -   |
| `/manager/sessions`, `/manager/menu`, `/manager/categories`                          |    -    |    X    |   -   |   -   |
| `/manager/orders`, `/manager/refunds`, `/manager/refund-policies`                    |    -    |    X    |   -   |   -   |
| `/manager/robot`, `/manager/trays`, `/manager/pickup-slots`, `/manager/slot-configs` |    -    |    X    |   -   |   -   |
| `/manager/users`, `/manager/verify`                                                  |    -    |    X    |   -   |   -   |
| `/staff`, `/staff/live-orders`, `/staff/orders`                                      |    -    |    -    |   X   |   -   |
| `/staff/stock`, `/staff/change-proposals`, `/staff/pickup-slots`, `/staff/profile`   |    -    |    -    |   X   |   -   |
| `/admin`, `/admin/verifications`, `/admin/logs`                                      |    -    |    -    |   -   |   X   |

##### 3.1.2 Non-Screen System Functions

| #     | System Function Name            | Technical Component                             | Description                                                                                                                                   |
| :---- | :------------------------------ | :---------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **API Client Service**          | `lib/api/client.ts`                             | Axios instance handling HTTP requests, auto-attaching Bearer JWT tokens, handling token refresh flow, and standardizing API error responses.  |
| **2** | **Server State Management**     | `React Query` (`@tanstack/react-query`)         | Handles server data fetching, response caching, background refetching, pagination, and optimistic UI updates for orders and inventory.        |
| **3** | **Form Validation Schema**      | `ValidationService` (`Zod` + `React Hook Form`) | Centralized form schemas (`LoginSchema`, `RegisterSchema`, `PasswordSchema`) enforcing client-side validation prior to API transmission.      |
| **4** | **Image Upload Handler**        | `Cloudinary Integration`                        | Cloud-based image management for avatar pictures, student identity card photos, dish thumbnails, and refund proof images.                     |
| **5** | **Real-Time Notification**      | `WebSocket Notification Service`                | Real-time WebSocket connection delivering live order status changes (`OrderStatus`), change proposal alerts, and pickup notifications.        |
| **6** | **Payment Gateway Integration** | `PaymentService` (`VNPAY`, `PayOS`)             | Integrates external Vietnamese payment gateways for wallet top-up transactions, handling IPN webhooks, signature verification, and callbacks. |

##### 3.1.3 Conceptual Data Modeling (CDM)

| #      | Entity Name            | Description & Key Attributes                                                                                                                     |
| :----- | :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | `Users`                | User accounts (`id`, `name`, `email`, `passwordHash`, `phoneNumber`, `role`, `status`, `studentId`, `majorOrClass`, `avatarUrl`).                |
| **2**  | `Sessions`             | Meal service windows (`id`, `title`, `description`, `availableFrom`, `availableTo`, `availableForOrder`, `finalizationDeadline`, `isFinalized`). |
| **3**  | `Categories`           | Meal categories (`id`, `name`, `description`, `displayOrder`, `isActive`).                                                                       |
| **4**  | `Dishes`               | Dish items (`id`, `categoryId`, `title`, `price`, `description`, `imageUrl`, `stockQuantity`, `isAvailable`).                                    |
| **5**  | `Orders`               | Customer orders (`id`, `userId`, `sessionId`, `totalAmount`, `status`, `paymentMethod`, `qrCode`, `otpCode`, `createdAt`).                       |
| **6**  | `OrderItems`           | Order line items (`id`, `orderId`, `dishId`, `unitPrice`, `quantity`, `subTotal`, `status`).                                                     |
| **7**  | `Wallets`              | Customer digital wallet (`userId`, `balance`, `currency`, `lastUpdated`).                                                                        |
| **8**  | `WalletTransactions`   | Wallet logs (`id`, `userId`, `amount`, `type`, `description`, `referenceId`, `createdAt`).                                                       |
| **9**  | `RefundRequests`       | Refund claims (`id`, `orderId`, `userId`, `policyCode`, `description`, `proofImages`, `status`, `rejectionReason`).                              |
| **10** | `ChangeProposals`      | Substitution proposals (`id`, `orderItemId`, `suggestedDishId`, `status`, `allowedActions`, `createdAt`).                                        |
| **11** | `Trays`                | RFID Trays (`id`, `rfidTag`, `status`, `currentSlotId`, `lastAssignedAt`).                                                                       |
| **12** | `PickupSlots`          | Automated pickup slots (`id`, `slotNumber`, `status`, `currentTrayId`, `isLocked`).                                                              |
| **13** | `RobotArms`            | Robotic arms (`id`, `armCode`, `status`, `isMaintenanceMode`, `lastActivityAt`).                                                                 |
| **14** | `VerificationRequests` | Student ID checks (`id`, `userId`, `studentCardPhotoUrl`, `status`, `rejectionReason`, `processedAt`).                                           |
| **15** | `SystemLogs`           | System audit logs (`id`, `userId`, `action`, `entityName`, `entityId`, `details`, `timestamp`).                                                  |

---

#### 3.2 CUSTOMER / STUDENT APPLICATION

#### 3.2.1 Login Page (`/login`)

- **Function Trigger**:
  - User navigates directly to URL `/login` or clicks UI button **"Đăng nhập"** on Header navigation bar.
- **Function Description**:
  - Authenticate Customer/Student via Email/Password or OAuth Google login.
- **Function Details**:
  - **Auth State Check**: If authenticated → Auto-redirect to Home page (`/`).
  - **Layout & Form Fields**:
    - UI Field `"Email"` (`email`): Text input (valid email format).
    - UI Field `"Mật khẩu"` (`password`): Password input.
    - UI Link `"Quên mật khẩu?"` → Navigate to `/forgot-password`.
  - **User Actions & Buttons**:
    - UI Button **"Đăng nhập"** (Disabled while pending API request, shows UI label _"Đang đăng nhập..."_).
    - UI Button **"Đăng ký ngay"** → Navigate to `/register`.
    - UI Button **"Tiếp tục với Google"** → Triggers OAuth2 authentication call via `/api/auth/google`.
  - **Validation Rules & Business Rules (`LoginSchema`)**:
    - `email`: Required, valid Regex Email format.
    - `password` (`PasswordSchema`): Minimum **8 characters**, at least **1 uppercase letter** (`A-Z`), at least **1 digit** (`0-9`), at least **1 special character** (`!@#$%^&*(),.?":{}|<>...`).
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Store JWT Access Token & Refresh Token, update Zustand store (`useUser`), show UI Toast _"Đăng nhập thành công!"_, redirect to Home page (`/`).
    - **Failure (401 Unauthorized)**: Show UI Toast _"Email hoặc mật khẩu không chính xác."_
    - **Failure (403 Forbidden)**: Returns `errorCode` `"AccountSuspended"` or `"AccountBanned"` → Show UI Toast message with server reason and auto-redirect to `/suspended`.

---

#### 3.2.2 Register Page (`/register`)

- **Function Trigger**:
  - User clicks UI button **"Đăng ký ngay"** on Login Page or navigates directly to URL `/register`.
- **Function Description**:
  - Register a new student account with personal details and strong password security.
- **Function Details**:
  - **Layout & Form Fields**:
    - UI Field `"Họ và tên"` (`name`): Minimum 2 characters.
    - UI Field `"Email"` (`email`): Valid email format.
    - UI Field `"Mật khẩu"` (`password`): Follows `PasswordSchema`.
    - UI Field `"Xác nhận mật khẩu"` (`confirmPassword`): Must match `password` 100%.
    - UI Field `"Mã sinh viên"` (`studentId`): Optional text input.
    - UI Field `"Ngày sinh"` (`dateOfBirth`): User age derived from DOB must be between 10 and 100 years old.
    - UI Field `"Số điện thoại"` (`phoneNumber`): Standard 10-digit Vietnamese phone regex (`/^((\+84)|0)(3|5|7|8|9)+([0-8]{1})\d{7}$/`).
    - UI Field `"Chuyên ngành / Lớp"` (`majorOrClass`): Optional text input.
    - UI Field `"Địa chỉ"` (`address`): Optional text input.
    - UI Field `"Giới tính"` (`gender`): Select dropdown (`1`: Nam, `2`: Nữ, `3`: Khác).
  - **User Actions & Buttons**:
    - UI Button **"Tạo tài khoản"** (Disabled while request is pending).
  - **Validation Rules & Business Rules (`RegisterSchema`)**:
    - Form validation using Zod schema prior to sending API request to `/api/Auth/register`.
  - **Results & Flow Handling**:
    - **Success (200 OK / 201 Created)**: Show UI Toast _"Đăng ký thành công!"_ → Auto-redirect to `/verify-email`.
    - **Failure (400 Bad Request / 409 Conflict)**: Show UI Toast _"Email đã tồn tại trong hệ thống."_

---

#### 3.2.3 Email Verification Page (`/verify-email`)

- **Function Trigger**:
  - User is redirected from Registration page upon creating a new account or clicks verification link in email.
- **Function Description**:
  - Allows new students to enter the 6-digit OTP code received via email to activate their account.
- **Function Details**:
  - **Layout & Form Fields**:
    - UI Field `"Mã OTP"` (`otp`): 6-digit numeric OTP input field.
  - **User Actions & Buttons**:
    - UI Button **"Xác nhận OTP"** (Submits code to `/api/Auth/verify-email`).
    - UI Button **"Gửi lại mã OTP"** (Triggers new OTP generation email).
  - **Validation Rules & Business Rules**:
    - `otp` must be exactly 6 numeric digits (`/^\d{6}$/`).
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Account status updated to verified (`isActive = true`) → Show UI Toast _"Xác minh Email thành công!"_ and redirect to `/verification` or `/login`.
    - **Failure (400 Bad Request)**: Show UI Toast _"Mã OTP không chính xác hoặc đã hết hạn."_

---

#### 3.2.4 Student Identity Verification Page (`/verification`)

- **Function Trigger**:
  - User navigates to `/verification` from Email Verification page or User Profile page to verify student identity.
- **Function Description**:
  - Allows students to upload proof photos of their official Student ID Card for admin verification and approval.
- **Function Details**:
  - **Layout & Form Fields**:
    - UI Image Dropzone `"Ảnh thẻ sinh viên"` (`studentCardPhoto`): Image file upload input supporting PNG/JPG.
    - Status Preview: Displays current verification state (Pending, Approved, Rejected with feedback).
  - **User Actions & Buttons**:
    - UI Button **"Gửi xác minh sinh viên"** (Uploads image to Cloudinary & submits verification request).
  - **Validation Rules & Business Rules**:
    - Image file size must not exceed 5MB. Must be valid image MIME format.
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Submits verification request for admin review → Show UI Toast _"Đã gửi yêu cầu xác minh sinh viên!"_.
    - **Failure (400 Bad Request)**: Show UI Toast error message.

---

#### 3.2.5 Forgot Password Page (`/forgot-password`)

- **Function Trigger**:
  - User clicks UI link `"Quên mật khẩu?"` on Login Page or navigates directly to `/forgot-password`.
- **Function Description**:
  - Allows users to enter their registered email address to receive a secure password reset link and token via email.
- **Function Details**:
  - **Layout & Form Fields**:
    - UI Field `"Email"` (`email`): Text input with email format validation.
  - **User Actions & Buttons**:
    - UI Button **"Gửi yêu cầu khôi phục"** (Submits email to `/api/Auth/forgot-password`).
  - **Validation Rules & Business Rules**:
    - Email must follow standard valid email format regex.
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Sends password reset link via email → Show UI Toast _"Vui lòng kiểm tra hòm thư Email để nhận liên kết đặt lại mật khẩu!"_.
    - **Failure (404 Not Found)**: Show UI Toast _"Email không tồn tại trên hệ thống."_

---

#### 3.2.6 Reset Password Page (`/reset-password`)

- **Function Trigger**:
  - User clicks password reset link containing token in email or navigates to `/reset-password?token=[token]`.
- **Function Description**:
  - Allows users to set a new password securely using a verified reset token.
- **Function Details**:
  - **Layout & Form Fields**:
    - UI Field `"Mật khẩu mới"` (`newPassword`): Password input with toggle show/hide.
    - UI Field `"Xác nhận mật khẩu mới"` (`confirmPassword`): Password input.
  - **User Actions & Buttons**:
    - UI Button **"Đặt lại mật khẩu"** (Submits token and new password to `/api/Auth/reset-password`).
  - **Validation Rules & Business Rules (`ResetPasswordSchema`)**:
    - `newPassword` must follow `PasswordSchema` (min 8 chars, 1 uppercase, 1 digit, 1 special char).
    - `confirmPassword` must match `newPassword` 100%.
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Password updated successfully → Show UI Toast _"Đặt lại mật khẩu thành công!"_ and redirect to `/login`.
    - **Failure (400 Bad Request)**: Show UI Toast _"Mã khôi phục không hợp lệ hoặc đã hết hạn."_

---

#### 3.2.7 Meal Sessions Page (`/session`)

- **Function Trigger**:
  - User clicks UI navigation item **"Phiên ăn"** (`"Meal Sessions"`) on top Header navigation bar or navigates directly to `/session`.
- **Function Description**:
  - Displays list of active and upcoming Meal Sessions grouped by date, allowing users to select a date and choose an available meal session to view dishes and place orders.
- **Function Details**:
  - **Layout & Elements**:
    - Calendar Date Selector Bar: Horizontal scrollable date bar allowing selection of dates.
    - Session Cards (_Sáng_, _Trưa_, _Tối_): Displays session name, description, serving time range (`availableFrom` - `availableTo`), order opening window (`availableForOrder`), and meal icon.
    - Status Badges: **"ĐANG MỞ"** (`Active`), **"SẮP DIỄN RA"** (`Upcoming`), **"ĐÃ CHỐT"** (`Finalized`), **"ĐÃ ĐÓNG"** / **"HẾT HẠN"** (`Closed` / `Expired`).
  - **User Actions & Buttons**:
    - **Select Date**: Filters meal sessions available for the selected calendar date.
    - **Click Meal Session Card**: Navigates to `/menu?sessionId=[sessionId]` if session is active or available for ordering.
  - **Validation Rules & Business Rules**:
    - Expired or finalized sessions (`isFinalized = true` or current time passed `availableTo`) disable card interaction, render UI Badge _"ĐÃ CHỐT"_ or _"ĐÃ ĐÓNG"_, and prevent navigation to ordering.
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Displays meal sessions list for selected date. Clicking an active session card redirects user to Session Detail & Menu page (`/menu?sessionId=[id]`).
    - **Failure**: No sessions found for selected date → Displays empty state message _"Không có ca ăn nào trong ngày này."_

---

#### 3.2.8 Meal Session Detail & Menu Page (`/menu?sessionId=[id]`)

- **Function Trigger**:
  - User selects an active meal session card from `/session` page or navigates directly to `/menu?sessionId=[id]`.
- **Function Description**:
  - Interactive ordering workspace displaying meal session details, menu template selector, category filters, interactive food tray (drag-and-drop), dish cards grid, dish search, category limit validation, and cart management.
- **Function Details**:
  - **Layout & Elements**:
    - **Session Header Banner**: Displays Session Title, Time Range (`availableFrom` - `availableTo`), Date, and Status badges (**"ĐANG MỞ CHỌN MÓN"**, **"SẮP DIỄN RA"**, **"ĐÃ CHỐT ĐƠN"**).
    - **Menu Template Selector**: Horizontal template pill carousel (e.g. Suất cơm cố định, Thực đơn tự chọn).
    - **Interactive Food Tray Workspace**: Visual tray view supporting drag-and-drop dish placement, displaying selected item thumbnails and quantities.
    - **Category Filter Pills (`Category Pills`)**: Category tabs (**"Tất cả"**, **"Cơm"**, **"Bún / Phở"**, **"Đồ uống"**, **"Tráng miệng"**...) displaying current selected item counts and min/max category constraints (`isRequired`, `minQuantity`, `maxQuantity`).
    - **Dish Search Bar**: Real-time text search for filtering dishes by title or description.
    - **Dish Card Grid**: Dish thumbnail, Dish title, Description, Unit price (Canteen Points / Xu), Quantity selected badge (`xN`), and UI Button **"Thêm vào giỏ"**.
    - **Floating Cart Button (FAB)**: Floating shopping cart button displaying current session item count.
  - **User Actions & Buttons**:
    - **Select Template**: Switches active meal template rule set.
    - **Click "Thêm vào giỏ" / Drag to Tray**: Checks category rules and stock availability:
      - Valid → Adds dish to cart, updates Zustand store (`useCart`), bounces tray/cart animations, and displays UI Toast _"Đã thêm [tên món] vào giỏ!"_.
      - Exceeded Category Limit → Blocks action and displays UI Toast error _"Danh mục đã đạt giới hạn tối đa"_.
    - **Remove / Drag out of Tray**: Decrements quantity or removes dish from cart with UI Toast feedback.
    - **Click FAB Cart Button**: Opens Cart drawer / navigates to `/cart`.
  - **Validation Rules & Business Rules**:
    - Block dish selection if session is expired or finalized (`isFinalized = true` or `availableTo` passed).
    - Block dish selection if category `maxQuantity` is reached for the selected template.
    - Disable dish card and show out-of-stock badge if dish `stockQuantity = 0`.
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Dish added to cart, tray visual updated, cart count incremented.
    - **Failure**: Session closed or stock limit reached → Action blocked with UI Toast error message.

---

#### 3.2.9 Cart Page (`/cart`)

- **Function Trigger**:
  - User clicks UI Cart icon on Header or opens cart drawer.
- **Function Description**:
  - Review items added to cart, adjust dish quantities, select target meal session, and check total price.
- **Function Details**:
  - **Layout & Form Fields**:
    - UI Checkbox **"Chọn tất cả"** / Individual item checkboxes.
    - Item list: Dish image, Dish title, Unit price, Quantity stepper (`+` / `-`), UI Button **"Xóa"** (Trash icon).
    - UI Summary Box (`Summary Box`): Total price of selected items, UI Button **"Tiến hành thanh toán"**.
  - **User Actions & Buttons**:
    - Quantity stepper: Updates item count in Zustand Cart store (`useCart`).
    - UI Button **"Tiến hành thanh toán"**: Navigates to `/checkout` (disabled if no items selected).
  - **Results & Flow Handling**:
    - **Success**: Redirects user to Checkout page (`/checkout`).

---

#### 3.2.10 Checkout & Payment Page (`/checkout`)

- **Function Trigger**:
  - User clicks UI Button **"Tiến hành thanh toán"** on Cart page.
- **Function Description**:
  - Select payment method, review order item summary, and create order with pickup credentials.
- **Function Details**:
  - **Layout & Form Fields**:
    - Payment Method Selector:
      1. UI Option **"Ví Smart Canteen"** (Displays current available wallet balance).
      2. UI Option **"Cổng VNPAY"**.
      3. UI Option **"Cổng PayOS"**.
  - **User Actions & Buttons**:
    - UI Button **"Xác nhận thanh toán"**:
      - If Wallet selected & balance < total amount: Render UI warning error _"Số dư ví không đủ, cần nạp thêm X VNĐ"_ + UI Button **"Nạp tiền ngay"**.
      - If VNPAY / PayOS selected: Redirect user to payment gateway URL.
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Order created successfully, wallet balance deducted (if Wallet used), generate QR Code & OTP pickup credentials → Auto-redirect to `/orders/[id]`.

---

#### 3.2.11 Order History Page (`/orders`)

- **Function Trigger**:
  - User clicks UI navigation item **"Lịch sử đơn hàng"** on top Header or navigation bar.
- **Function Description**:
  - Overview dashboard displaying the student's complete order history, summary metrics (total orders, pending, completed, total spent points), status tab filters, date range filter, and text search.
- **Function Details**:
  - **Layout & Elements**:
    - **Header & Search Bar**: Title and real-time search input (filters by Order ID or Session Name).
    - **Date Filter Dropdown**: Filter by Session Serving Date (`sessionDate`) or Order Placement Date (`created`), with "From Date" / "To Date" pickers.
    - **Orders Summary Metrics Bar (`OrdersStats`)**: Displays Total Orders count, Pending orders count, Completed count, and Total Spent Points.
    - **Status Tabs Filter (`Tabs`)**: Filter tabs: _"Tất cả"_, _"Chờ xử lý"_ (`0`), _"Đang chuẩn bị"_ (`4`), _"Sẵn sàng"_ (`1`), _"Hoàn thành"_ (`2`), _"Đã hủy"_ (`3`), _"Quá hạn"_ (`7`).
    - **Order Cards List (`OrderCard`)**: Card view displaying Order ID, Session Name, Created Date, Status Badge, Total Amount, and Quick Action buttons (**"Xem chi tiết"**, **"Yêu cầu hoàn tiền"**).
  - **User Actions & Buttons**:
    - **Click Order Card / "Xem chi tiết"**: Navigates to Order Detail page `/orders/[id]`.
    - **Click "Yêu cầu hoàn tiền"**: Navigates to `/refund?orderId=[id]`.
    - **Filter / Search**: Dynamically updates order list based on status tab, date range, or search keyword.
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Renders filtered orders list with SignalR live updates when an order status changes.

---

#### 3.2.12 Order Detail & Real-time Tracking Page (`/orders/[id]`)

- **Function Trigger**:
  - User clicks an order item from `/orders` page or is automatically redirected after completing payment at `/checkout`.
- **Function Description**:
  - Detailed real-time tracking workspace displaying order status progress, QR Code & OTP pickup credentials, dish items list, session serving time window, kitchen change proposal resolution (`SwapItem`, `RefundItem`, `RefundOrder`), and pickup confirmation.
- **Function Details**:
  - **Layout & Elements**:
    - **Order Header & Status Badge**: Displays Order ID, Created Date, and live status badge (`Pending`, `Preparing`, `ReadyForPickup`, `Completed`, `Cancelled`, `Expired`).
    - **Session Info Banner**: Displays Session Name, Session Serving Time Range (`availableFrom` - `availableTo`), and Session Date.
    - **QR Code & OTP Pickup Credentials**: Displayed when status is `ReadyForPickup` (`1`), allowing automated pickup at smart canteen slots/counter.
    - **Order Items List**: Thumbnail, Dish Name, Quantity, Unit Price (Points), Item Status (`OrderItemStatus`), and Change Proposal Action Panel if kitchen issued a substitution proposal.
    - **Payment Summary**: Item Count, Total Price (Points), and Transaction ID.
  - **User Actions & Buttons**:
    - **Click "Xác nhận đã nhận"**: Sends confirmation to backend when customer retrieves meal, updating status to `Completed` (`2`).
    - **Respond to Kitchen Change Proposal**:
      - **"Đồng ý đổi món"** (`SwapItem`): Opens modal to select an alternative dish from the same session.
      - **"Hoàn tiền món"** (`RefundItem`): Refunds the specific out-of-stock dish value instantly back to Smart Canteen Wallet.
      - **"Hủy đơn & Hoàn tiền"** (`RefundOrder`): Cancels the entire order and refunds the full remaining amount to Smart Canteen Wallet.
  - **Validation & Business Rules**:
    - Real-time updates pushed via SignalR WebSocket (`Order.StatusChanged`).
    - QR Code and OTP code are rendered only when order reaches `ReadyForPickup` status.
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Displays live tracking details, QR/OTP credentials, handles dish swaps or instant refunds with toast notifications.

---

#### 3.2.13 Wallet & Top-up Page (`/wallet`)

- **Function Trigger**:
  - User clicks UI Wallet balance card on Header or navigates to `/wallet`.
- **Function Description**:
  - Allows students to check their available wallet balance, select top-up amount presets, and initiate wallet top-up via payment gateways (VNPAY / PayOS).
- **Function Details**:
  - **Layout & Elements**:
    - Wallet Balance Card: Displays current available balance (in Points / VNĐ).
    - Top-up Amount Preset Buttons: _50.000 VNĐ_, _100.000 VNĐ_, _200.000 VNĐ_, _500.000 VNĐ_ or custom amount input.
    - Payment Method Selector: Radio selection for **"Cổng VNPAY"** or **"Cổng PayOS"**.
  - **User Actions & Buttons**:
    - UI Button **"Nạp tiền vào ví"**: Initiates top-up payment gateway request and redirects user to external gateway URL.
    - UI Button **"Lịch sử giao dịch"**: Navigates to `/wallet/transactions`.
  - **Results & Flow Handling**:
    - **Success**: Redirects to payment gateway → Webhook/IPN credits wallet balance upon successful payment.

---

#### 3.2.14 Wallet Transaction History Page (`/wallet/transactions`)

- **Function Trigger**:
  - User clicks UI Link **"Lịch sử giao dịch"** on Wallet page or navigates to `/wallet/transactions`.
- **Function Description**:
  - Displays complete audit log of all wallet transactions (Top-ups, Order payments, Refund credits).
- **Function Details**:
  - **Layout & Elements**:
    - Transaction Items List: Transaction ID, Type (Top-up `+`, Payment `-`, Refund `+`), Amount, Description, and Timestamp (`createdAt`).
    - Transaction Filter: Filter by Transaction Type (All, Top-up, Payment, Refund).
  - **User Actions & Buttons**:
    - Filter transaction list by type or date range.
  - **Results & Flow Handling**:
    - **Success (200 OK)**: Renders paginated wallet transaction logs.

---

#### 3.2.15 Refund Request Page (`/refund`)

- **Function Trigger**:
  - User clicks UI Button **"Yêu cầu hoàn tiền"** on Order History or Order Detail page, or accesses `/refund`.
- **Function Description**:
  - Submit a refund claim for item issues or cancellations according to refund policy.
- **Function Details**:
  - **Refund Policy Codes (`REFUND_POLICIES`)**:
    - `wrong_item` (UI Option _"Sai món ăn"_)
    - `missing_item` (UI Option _"Thiếu món ăn"_)
    - `quality_issue` (UI Option _"Vấn đề chất lượng thực phẩm"_)
    - `other` (UI Option _"Lý do khác"_)
  - **Layout & Form Fields**:
    - UI Select `"Chọn đơn hàng"` (`orderId`).
    - UI Select `"Chọn lý do hoàn tiền"` (`policyCode`).
    - UI Input `"Mô tả chi tiết"` (`description`).
    - UI Upload `"Tải ảnh minh chứng"` (`proofImages`).
  - **Request Status Enums**:
    - `0`: `Pending` (UI Status _"Đang xử lý"_)
    - `1`: `Approved` (UI Status _"Đã duyệt"_ - Auto-credited to Smart Canteen Wallet)
    - `2`: `Rejected` (UI Status _"Từ chối"_ - Displays rejection reason `rejectionReason`)
  - **User Actions & Buttons**:
    - UI Button **"Gửi yêu cầu hoàn tiền"**: Submits request to manager approval queue.
  - **Results & Flow Handling**:
    - **Success (200 OK / 201 Created)**: Show UI Toast _"Đã gửi yêu cầu hoàn tiền!"_ → Redirects to order details or refund list.

---

#### 3.2.16 Dish Change Proposals Page (`/change-proposals`, `/notifications`)

- **Function Trigger**:
  - User receives system notification when an ordered dish runs out during tray assembly and kitchen staff issues a substitution proposal.
- **Function Description**:
  - Review replacement dish details and select resolution action.
- **Function Details**:
  - **Allowed Actions (`AllowedAction`)**:
    - `SwapItem` (UI Action **"Đồng ý đổi món"** - Accept kitchen's suggested dish).
    - `RefundItem` (UI Action **"Từ chối đổi món & Hoàn tiền món"** - Refund only the out-of-stock item to wallet).
    - `RefundOrder` (UI Action **"Từ chối đổi món & Hủy toàn bộ đơn"** - Refund full order value to wallet and cancel order).
  - **Proposal Status Enums (`ChangeProposalStatus`)**:
    - `0`: `Pending` (UI Badge _"Chờ phản hồi"_)
    - `1`: `Swapped` (UI Badge _"Đã đổi món thành công"_)
    - `2`: `ItemRefunded` (UI Badge _"Đã hoàn tiền món"_)
    - `3`: `OrderRefunded` (UI Badge _"Đã hoàn tiền & Hủy toàn đơn"_)

---

#### 3.2.17 User Profile Page (`/profile`)

- **Function Trigger**:
  - User selects UI Avatar menu option **"Hồ sơ cá nhân"**.
- **Function Description**:
  - Manage personal profile information, update avatar, change password, and upload Student ID card for verification.
- **Function Details**:
  - **Layout & Form Fields**:
    - UI Field `"Họ và tên"` (`name`), `"Email"` (`email`), `"Số điện thoại"` (`phoneNumber`), `"Mã sinh viên"` (`studentId`), `"Lớp / Chuyên ngành"` (`majorOrClass`).
    - UI Upload `"Ảnh thẻ sinh viên"` (`studentCardPhoto` - Uploaded to Cloudinary).
  - **User Actions & Buttons**:
    - UI Button **"Lưu thay đổi"**.
    - UI Button **"Gửi xác minh sinh viên"**.
    - UI Button **"Đổi mật khẩu"**.

---

### 3.3 MANAGER APPLICATION

#### 3.3.1 Manager Dashboard Page (`/manager`)

- **Function Trigger**:
  - Canteen Manager authenticates and accesses `/manager`.
- **Function Description**:
  - High-level overview dashboard displaying real-time business KPIs, daily revenue, active session stats, tray packing progress, and system health status.
- **Function Details**:
  - **KPI Cards**: Daily Revenue, Total Orders Today, Fulfillment Rate (%), Active Sessions Count.
  - **Real-time Order Distribution Chart**: Order status pie chart (`Pending`, `Preparing`, `Ready`, `Completed`, `Cancelled`).
  - **System Status Bar**: Live WebSocket status of Robot Arm, Pickup Slots, and RFID Trays.

---

#### 3.3.2 Revenue & Session Reports Page (`/manager/reports`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Báo cáo & Thống kê"** or accesses `/manager/reports`.
- **Function Description**:
  - Detailed analytics workspace for analyzing daily, weekly, and monthly canteen revenue, peak-hour order volume, and individual session performance (`/manager/reports/sessions/[sessionId]`).
- **Function Details**:
  - **Filters**: Date range selector (From Date / To Date), Session filter dropdown.
  - **Charts & Tables**: Hourly revenue bar chart, Session portion sales table, Refund loss breakdown table.
  - **User Actions & Buttons**:
    - UI Button **"Xuất báo cáo (Excel/PDF)"**.

---

#### 3.3.3 Meal Session Management Page (`/manager/sessions`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Ca phục vụ"** (`/manager/sessions`).
- **Function Description**:
  - Create new sessions, edit active sessions, finalize sessions (`Finalize Session` / `Finalize Now`), and view session calendar.
- **Function Details**:
  - **Form Fields & Code Parameters**:
    - `title` (UI Field `"Tên ca"`), `description` (UI Field `"Mô tả"`), `availableFrom` (UI Field `"Giờ mở bán"`), `availableTo` (UI Field `"Giờ đóng ca"`), `availableForOrder` (UI Field `"Giờ khóa nhận đơn"`), `finalizationDeadline` (UI Field `"Hạn chốt ca"`).
  - **User Actions & Buttons**:
    - UI Button **"Khóa đơn khẩn cấp"**.
    - UI Button **"Chốt ca ngay"** (`Finalize Now`).
    - UI Toggle Button **"Chế độ xem lịch ca"** (`Session Calendar`).

---

#### 3.3.4 Dish Management Page (`/manager/menu`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Quản lý món ăn"** (`/manager/menu`).
- **Function Description**:
  - Full CRUD operations for menu dishes, dish pricing, dish descriptions, image upload, and kitchen portion stock management.
- **Function Details**:
  - **Form Fields**: Dish Title, Category Select, Unit Price (Points), Description, Image Upload (Cloudinary), Initial Stock Quantity.
  - **User Actions & Buttons**:
    - UI Button **"Tạo món mới"**.
    - UI Button **"Cập nhật tồn kho bếp"** (`UPDATE_STOCK`).
    - UI Toggle Button **"Ẩn / Hiện món ăn"** (`isActive`).

---

#### 3.3.5 Category Management Page (`/manager/categories`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Quản lý danh mục"** (`/manager/categories`).
- **Function Description**:
  - CRUD operations for meal categories (Cơm, Bún/Phở, Đồ uống, Tráng miệng), category icons, display order, and active state.
- **Function Details**:
  - **Form Fields**: Category Name, Description, Display Order, Thumbnail Upload.
  - **User Actions & Buttons**:
    - UI Button **"Tạo danh mục mới"**.
    - UI Button **"Sắp xếp thứ tự hiển thị"**.

---

#### 3.3.6 Order Management Page (`/manager/orders`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Đơn hàng"** (`/manager/orders`).
- **Function Description**:
  - Search, filter, and inspect all customer orders by meal session, student name, or order ID; intervene and update order status when technical errors occur.
- **Function Details**:
  - **Filters**: Status tab filter, Session filter, Date range filter, Search bar.
  - **User Actions & Buttons**:
    - UI Button **"Xem chi tiết đơn"**.
    - UI Button **"Hủy đơn khẩn cấp"** (For system overrides).

---

#### 3.3.7 Refund Requests Approval Page (`/manager/refunds`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Yêu cầu hoàn tiền"** (`/manager/refunds`).
- **Function Description**:
  - Review student refund claims, inspect attached proof images, and approve or reject claims with reason feedback.
- **Function Details**:
  - **Layout & Elements**: List of pending refund requests displaying Student Name, Order ID, Policy Code, Proof Photos, and Claim Description.
  - **User Actions & Buttons**:
    - UI Button **"Phê duyệt"**: System automatically credits refund amount to student's Smart Canteen Wallet.
    - UI Button **"Từ chối"**: Requires entering rejection reason `rejectionReason` in UI input.

---

#### 3.3.8 Refund Policy Management Page (`/manager/refund-policies`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Chính sách hoàn tiền"** (`/manager/refund-policies`).
- **Function Description**:
  - Configure automated refund policy rules (% refund rate, proof photo requirements, and policy codes).
- **Function Details**:
  - **Form Fields**: Policy Code (`wrong_item`, `missing_item`, `quality_issue`), Policy Name, Refund Percentage (1-100%), Require Proof Image (Boolean).
  - **User Actions & Buttons**:
    - UI Button **"Cập nhật chính sách"**.

---

#### 3.3.9 Robot Arm Management Page (`/manager/robot`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Cánh tay Robot"** (`/manager/robot`).
- **Function Description**:
  - Monitor Robotic Arm operational telemetry, execution speed, error logs, and toggle maintenance modes.
- **Function Details**:
  - **Robot Status Enums (`RobotArmStatus`)**: `Idle` (_"Rảnh"_), `Busy` (_"Bận"_), `Error` (_"Lỗi"_), `Maintenance` (_"Bảo trì"_), `Offline` (_"Ngoại tuyến"_).
  - **User Actions & Buttons**:
    - UI Toggle Button **"Bật Chế độ bảo trì"**.
    - UI Button **"Reset Robot"** (Clears hardware fault flags).

---

#### 3.3.10 RFID Tray Management Page (`/manager/trays`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Khay ăn RFID"** (`/manager/trays`).
- **Function Description**:
  - Track physical RFID tray inventory, tray assignment states, and perform bulk tray registration or emergency tray release.
- **Function Details**:
  - **Tray Status Enums (`TrayStatus`)**: `Available` (_"Sẵn sàng"_), `Reserved` (_"Đã giữ chỗ"_), `InUse` (_"Đang sử dụng"_).
  - **User Actions & Buttons**:
    - UI Button **"Thêm khay ăn hàng loạt"** (Prefix, Index range `from` - `to`).
    - UI Button **"Giải phóng khay khẩn cấp"** (`Force Release`).

---

#### 3.3.11 Pickup Slot Management Page (`/manager/pickup-slots`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Ô lấy món"** (`/manager/pickup-slots`).
- **Function Description**:
  - Monitor physical pickup slot doors, tray occupation status, solenoid lock state, and clear occupied slots manually.
- **Function Details**:
  - **Slot Status Enums (`PickupSlotStatus`)**: `Empty` (_"Trống"_), `Occupied` (_"Đã có khay"_), `Locked` (_"Đang khóa"_), `Maintenance` (_"Bảo trì"_).
  - **User Actions & Buttons**:
    - UI Button **"Dọn dẹp ô kệ khẩn cấp"** (`Force Clear`).
    - UI Button **"Mở cửa ô lấy món khẩn cấp"** (`Force Open`).

---

#### 3.3.12 Pickup Slot Mappings Configuration Page (`/manager/slot-configs`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Cấu hình ô kệ"** (`/manager/slot-configs`).
- **Function Description**:
  - Configure spatial coordinates and robot arm motion path mapping coordinates for each pickup slot.
- **Function Details**:
  - **Form Fields**: Slot Number, Shelf Level, X/Y/Z Axis Coordinates, Target Station ID.
  - **User Actions & Buttons**:
    - UI Button **"Lưu tọa độ ô kệ"**.

---

#### 3.3.13 User Management & Suspension Page (`/manager/users`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Người dùng"** (`/manager/users`).
- **Function Description**:
  - Manage student and staff account list, perform account suspension (`Suspend`), ban (`Ban`), or reactivation (`Reactivate`).
- **Function Details**:
  - **User Status Enums**: `Active` (`1`), `Inactive` (`2`), `Suspended` (`4`), `Banned` (`5`).
  - **User Actions & Buttons**:
    - UI Button **"Tạm khóa"** (`Suspend` - Requires reason text).
    - UI Button **"Cấm tài khoản"** (`Ban` - Requires reason text).
    - UI Button **"Kích hoạt lại"**.

---

#### 3.3.14 Counter Identity Verification Page (`/manager/verify`)

- **Function Trigger**:
  - Manager clicks UI Sidebar item **"Xác thực tại quầy"** (`/manager/verify`).
- **Function Description**:
  - Search student accounts and manually verify OTP pickup codes or QR Codes at canteen counter during student device battery/network failure.
- **Function Details**:
  - **Form Fields**: OTP 6-digit input / Search Student Email or Phone Number.
  - **User Actions & Buttons**:
    - UI Button **"Xác nhận nhận món tại quầy"**.

---

### 3.4 KITCHEN STAFF APPLICATION

#### 3.4.1 Staff Operations Dashboard (`/staff`)

- **Function Trigger**:
  - Kitchen Staff authenticates and navigates to `/staff`.
- **Function Description**:
  - Real-time operational dashboard displaying total portions to pack onto trays, live order queue, and hardware alerts.
- **Function Details**:
  - Metrics: Total Portions Packed Today, Current Active Queue Count, Out-of-stock Items Alert.

---

#### 3.4.2 Live Serving Queue Page (`/staff/live-orders`)

- **Function Trigger**:
  - Staff clicks UI menu **"Hàng chờ soạn khay"** (`/staff/live-orders`).
- **Function Description**:
  - Real-time prioritized queue displaying order dishes to pack onto physical RFID trays.
- **Function Details**:
  - **Layout**: Order cards arranged in time order displaying Dish List, Quantities, Target Session, and Assigned RFID Tray Code.
  - **User Actions & Buttons**:
    - UI Button **"Xác nhận đã soạn khay"**: Triggers Robot Arm dispatch to transport tray to assigned pickup slot.

---

#### 3.4.3 Kitchen Orders List Page (`/staff/orders`)

- **Function Trigger**:
  - Staff clicks UI menu **"Danh sách đơn ca"** (`/staff/orders`).
- **Function Description**:
  - View full history of prepared orders within the active meal session, filter by order status, and inspect tray assembly timestamps.
- **Function Details**:
  - Status Filter: Prepared, In Transit, Delivered to Slot, Completed.

---

#### 3.4.4 Dish Stock & Shelf Stock Management Page (`/staff/stock`)

- **Function Trigger**:
  - Staff clicks UI menu **"Tồn kho kệ bếp"** (`/staff/stock`).
- **Function Description**:
  - Rapidly update actual physical dish portion counts remaining on kitchen serving shelves when kitchen replenishes fresh dishes.
- **Function Details**:
  - Layout: Grid of active dishes with `+` / `-` portion steppers.
  - **User Actions & Buttons**:
    - UI Button **"Cập nhật tồn kho kệ"**.

---

#### 3.4.5 Change Proposals Management Page (`/staff/change-proposals`)

- **Function Trigger**:
  - Staff clicks UI menu **"Đề xuất đổi món"** (`/staff/change-proposals`).
- **Function Description**:
  - Issue substitution proposals to students when an ordered dish runs out of stock during tray assembly.
- **Function Details**:
  - **Form Fields**: Order Item Select, Out-of-Stock Dish, Suggested Replacement Dish Select, Response Deadline.
  - **User Actions & Buttons**:
    - UI Button **"Tạo đề xuất đổi món"**.

---

#### 3.4.6 Pickup Slot & Station Monitoring Page (`/staff/pickup-slots`)

- **Function Trigger**:
  - Staff clicks UI Sidebar item **"Liên kết ô kệ"** (`/staff/pickup-slots`).
- **Function Description**:
  - Manually bind trays to pickup slots (`Bind pickup slot`) during automated system hardware overrides.
- **Function Details**:
  - **User Actions & Buttons**:
    - UI Select `"Khay RFID"` + UI Select `"Ô kệ nhận món"` → UI Button **"Gán khay vào ô"**.

---

#### 3.4.7 Staff Profile Page (`/staff/profile`)

- **Function Trigger**:
  - Staff clicks UI Sidebar item **"Hồ sơ cá nhân"** (`/staff/profile`).
- **Function Description**:
  - View staff account information, assigned shift details, and trigger account logout.

---

### 3.5 SYSTEM ADMIN APPLICATION

#### 3.5.1 Admin Dashboard (`/admin`)

- **Function Trigger**:
  - System Admin authenticates and accesses `/admin`.
- **Function Description**:
  - System health monitoring dashboard, active user account tally, and pending student verification requests.

---

#### 3.5.2 Student Identity Verifications Approval Page (`/admin/verifications`)

- **Function Trigger**:
  - Admin selects UI menu **"Phê duyệt xác minh sinh viên"** (`/admin/verifications`).
- **Function Description**:
  - Inspect uploaded student card photos, match information, and approve or reject verification requests with feedback.
- **Function Details**:
  - UI Button **"Phê duyệt"** (`Approve`): Updates student account verification status to confirmed.
  - UI Button **"Từ chối"** (`Reject`): Requires entering rejection reason feedback.

---

#### 3.5.3 Audit Logs Monitoring Page (`/admin/logs`)

- **Function Trigger**:
  - Admin selects UI menu **"Nhật ký hệ thống"** (`/admin/logs`).
- **Function Description**:
  - Search and inspect full system activity audit trail (System Audit Logs), robot status logs, wallet top-up transactions, and user permission changes.

---

### 4. Non-Functional Requirements

#### 4.1 External Interfaces

- **User Interface**: Responsive web interface supporting desktop, tablet, and mobile displays using Tailwind CSS 4 and shadcn/ui components.
- **Hardware Interfaces**: RESTful/WebSocket communication with RFID Tray scanner modules, Pickup Slot door solenoids, and Robot Arm PLC controllers.
- **Software Interfaces**: Cloudinary API for media storage, VNPAY / PayOS APIs for payment processing, SMTP server for verification emails.
- **Communication Protocols**: Secure HTTPS for REST API requests, Secure WSS (WebSocket Secure) for real-time order and hardware notifications.

#### 4.2 Quality Attributes

- **Performance**: Page load time under 2 seconds; API response time under 200ms; real-time WebSocket state update latency under 100ms.
- **Security**: JWT Bearer token authentication, HTTP-only secure cookies, CORS protection, client-side input validation via Zod, HTTPS encryption.
- **Reliability**: 99.9% uptime availability during canteen operating hours; graceful error fallbacks when hardware modules disconnect.
- **Usability**: High contrast design system, responsive touch-friendly elements, intuitive 3-step checkout flow, localized Vietnamese UI labels.
- **Availability**: System operational 24/7 with background maintenance window scheduling.

---

### 5. Requirement Appendix

#### 5.1 Business Rules

| Rule ID   | Name                     | Condition & Enforcement Rule                                                                                                                                 |
| :-------- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BR-01** | Password Security        | Minimum 8 characters, at least 1 uppercase letter (`A-Z`), 1 digit (`0-9`), and 1 special character (`!@#$%^&*...`).                                         |
| **BR-02** | Vietnamese Phone Format  | Must match regex `/^((\+84)\|0)(3\|5\|7\|8\|9)+([0-8]{1})\d{7}$/`.                                                                                           |
| **BR-03** | Order Lock Deadline      | Orders for a session are automatically locked when time reaches `availableForOrder`. No new orders accepted after lock time.                                 |
| **BR-04** | Session Finalization     | Sessions cannot be edited after `finalizationDeadline`. Manager must perform `Finalize Session` to lock inventory calculations.                              |
| **BR-05** | Wallet Payment Check     | Wallet checkout requires `WalletBalance >= TotalAmount`. If insufficient, system prompts top-up action.                                                      |
| **BR-06** | Automatic Refund Credit  | Approved refund claims automatically credit 100% of the approved amount to the student's Smart Canteen Wallet.                                               |
| **BR-07** | Dish Out-of-Stock Swap   | If a dish is out of stock during tray packing, staff issues a Change Proposal. Customer has 15 minutes to select `SwapItem`, `RefundItem`, or `RefundOrder`. |
| **BR-08** | Emergency Hardware Clear | Force release on trays or force clear on pickup slots logs an entry in `SystemLogs` with manager ID and timestamp.                                           |

#### 5.2 Common Requirements

- **Global Layout**: Consistent Header navigation bar, persistent Cart counter icon, user Avatar menu, and Footer links across all pages.
- **Theme Support**: Consistent color palette with CSS tokens, dark mode toggle support, and accessible color contrast.
- **Toast Notifications**: Standardized toast popups (`sonner`) for API success confirmation, form validation warnings, and network error alerts.
- **Loading & Skeleton States**: Dynamic Skeleton placeholders during data fetching to prevent layout shifts.

#### 5.3 Application Messages List

| Message Key                  | UI Display Message (Vietnamese)                       | Type    | Trigger Scenario                          |
| :--------------------------- | :---------------------------------------------------- | :------ | :---------------------------------------- |
| `MSG_LOGIN_SUCCESS`          | _"Đăng nhập thành công!"_                             | Success | User successfully authenticates.          |
| `MSG_LOGIN_FAILED`           | _"Email hoặc mật khẩu không chính xác."_              | Error   | Invalid email or password submitted.      |
| `MSG_ACCOUNT_SUSPENDED`      | _"Tài khoản của bạn đã bị tạm khóa. Lý do: {reason}"_ | Error   | Account status is suspended (403).        |
| `MSG_REGISTER_SUCCESS`       | _"Đăng ký thành công!"_                               | Success | Registration API returns 200/201.         |
| `MSG_EMAIL_EXISTS`           | _"Email đã tồn tại trong hệ thống."_                  | Error   | Email conflict during registration (409). |
| `MSG_OTP_INVALID`            | _"Mã OTP không chính xác hoặc đã hết hạn."_           | Error   | Verification OTP code fails validation.   |
| `MSG_PASSWORD_RESET_SUCCESS` | _"Đặt lại mật khẩu thành công!"_                      | Success | Password reset completes.                 |
| `MSG_ADD_TO_CART_SUCCESS`    | _"Đã thêm món ăn vào giỏ hàng!"_                      | Success | Item added to Zustand cart store.         |
| `MSG_STOCK_EMPTY`            | _"Hết suất"_                                          | Warning | Dish stock reaches 0.                     |
| `MSG_INSUFFICIENT_BALANCE`   | _"Số dư ví không đủ, cần nạp thêm {amount} VNĐ"_      | Warning | Wallet balance lower than order total.    |
| `MSG_ORDER_SUCCESS`          | _"Đặt hàng thành công!"_                              | Success | Order created and payment verified.       |
| `MSG_REFUND_SUBMITTED`       | _"Đã gửi yêu cầu hoàn tiền thành công!"_              | Success | Refund request submitted.                 |
| `MSG_SESSION_FINALIZED`      | _"Đã chốt ca phục vụ thành công!"_                    | Success | Manager finalizes meal session.           |

#### 5.4 Other Requirements

- **Browser Compatibility**: Fully tested and compatible with modern web browsers: Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari.
- **Mobile Responsiveness**: Responsive layout supporting screen resolutions from 320px (Mobile) to 4K (Desktop).
