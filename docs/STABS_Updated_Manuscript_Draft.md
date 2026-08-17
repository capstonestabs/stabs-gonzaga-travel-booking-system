# STABS: Smart Tourism Assistance and Booking System

A Capstone Project Presented to the Faculty of the  
College of Information and Computing Sciences  
Cagayan State University  
Gonzaga, Cagayan

In Partial Fulfillment of the Requirements for the Degree  
Bachelor of Science in Information Technology

Group Members:  
Frenelyn Maltizo  
Kicy Joy Segundo  
Sophia Joy Cummiting  
Krizele Perucho

---

## CHAPTER I
## INTRODUCTION

### Project Context

Tourism in Gonzaga, Cagayan depends heavily on timely destination information, service coordination, and clear communication between visitors and destination managers. In practice, however, many tourism transactions still rely on fragmented social media inquiries, manual confirmation, walk-in coordination, and separate communication channels for prices, schedules, and reservations. This creates delays, inconsistent information, and difficulty in tracking bookings, especially when visitors want to compare destinations before deciding to travel.

The rapid adoption of web technologies, online payments, and mobile access has changed how travelers expect tourism services to operate. Visitors now expect destination information, service packages, rates, booking dates, and reservation status to be available online in one place. They also expect a booking process that is easy to follow on both desktop and mobile devices. For destination managers and administrators, digital systems are equally important because they reduce repetitive manual work, improve record management, and make monitoring easier.

To address these issues, the researchers developed STABS, a Smart Tourism Assistance and Booking System designed for local tourism destinations. The system provides a centralized web platform where guests can browse destinations, view services and pricing, check destination contact details, and review destination availability before deciding to register. Registered tourists can create accounts, reserve services online, complete payment through PayMongo using GCash, view booking history, access tickets, and manage their own travel records. Assigned staff members can manage destination information, services, photos, schedules, and bookings, while the administrator can manage staff accounts, tourist accounts, and destination-based payout records.

Unlike the older concept of a broad smart tourism platform that included itinerary planning, accommodations from multiple categories, transportation orchestration, and AI-style assistance, the implemented STABS focuses on the actual system built for Gonzaga. It is a role-based destination booking and management platform with public browsing, tourist reservations, staff-side destination operations, and admin-side payout monitoring.

The developed system supports both online-bookable destinations and walk-in destinations. Online destinations use service-based availability, slot limits, date windows, and secure online checkout. Walk-in destinations remain informational inside the system and display only destination details, service information, prices, and contact details so that transactions can continue outside the platform. This design reflects the actual local operation of some Gonzaga destinations and keeps the system aligned with current business practices.

Overall, STABS aims to improve tourism service delivery in Gonzaga by centralizing destination information, reducing manual coordination, protecting booking capacity, and giving tourists, staff, and administrators a clearer and more organized workflow.

### Purpose and Description

STABS is a web-based Smart Tourism Assistance and Booking System that provides a centralized platform for destination browsing, service booking, booking management, and destination administration. Its main purpose is to improve how local tourism destinations in Gonzaga present their services and how tourists reserve available offerings.

The system is organized around four main user groups:

1. **Guests or visitors** who can browse destinations, photos, services, pricing, and contact information without creating an account.
2. **Registered tourists** who can sign in, book online services, pay through PayMongo using GCash, track booking status, and access booking history and tickets.
3. **Staff accounts** assigned to one destination, responsible for maintaining destination content, public contact details, service packages, service photos, availability dates, closed dates, and booking completion.
4. **Admin** who manages staff accounts, tourist accounts, and destination payout records through a separate workspace.

The system does not attempt to be a full travel marketplace for flights, national transport, or external accommodation networks. Instead, it focuses on Gonzaga destinations and the actual operational flow implemented in the project:

- public destination browsing
- service-based booking
- visual availability calendar
- temporary slot hold before payment
- GCash payment through PayMongo
- ticket generation after successful payment
- staff-side destination and service management
- admin-side payout monitoring and history

The system also reflects the local tourism setup by supporting both online and walk-in destination modes. If a destination is marked as walk-in, the system does not create a booking or reduce capacity. Instead, it displays prices, services, address, email, and phone details so visitors can contact the destination directly outside the system.

### Conceptual Framework

This study uses the Input-Process-Output (IPO) framework to explain how STABS transforms tourism data, account information, booking requests, and payment records into an organized Gonzaga destination booking platform.

**Input**

- tourist account data
- staff and admin account data
- destination information
- destination services and pricing
- service date windows and closed dates
- booking requests
- slot capacity rules
- payment transaction data
- feedback and public inquiry information

**Process**

- account registration and authentication
- tourist email verification and recovery
- destination publishing and service management
- availability checking and date validation
- temporary slot locking before payment
- payment processing through PayMongo GCash
- booking confirmation and ticket generation
- staff booking completion
- admin payout recording and history management

**Output**

- a centralized Gonzaga travel booking platform
- organized destination listings and service packages
- protected booking capacity and reduced overbooking
- downloadable tourist tickets
- staff-managed destination pages
- admin-monitored payout records and history

**Feedback**

- user feedback entries
- booking history review
- staff operational adjustments
- admin review of payout and activity records

**Note for manuscript figure:**  
Insert an updated IPO diagram that reflects the actual STABS flow:
Guest browsing -> Tourist account and booking -> Staff destination management -> Admin payout monitoring.

### Objectives

#### General Objective

To design and develop STABS, a Smart Tourism Assistance and Booking System, that centralizes destination information, service-based booking, GCash payment confirmation, staff destination management, and admin payout monitoring for tourism operations in Gonzaga, Cagayan.

#### Specific Objectives

Specifically, this study aims to:

1. Identify the common problems encountered in the current destination inquiry, booking, and record management processes in Gonzaga.
2. Design and develop a web-based booking system that allows public browsing of destinations, services, pricing, and destination details.
3. Develop a tourist account workflow that supports registration, email verification, password recovery, booking history, booking calendar, and ticket access.
4. Develop a staff workspace for destination management, service package management, service scheduling, and booking monitoring.
5. Develop an admin workspace for staff account management, tourist account management, and destination payout monitoring.
6. Integrate secure online payment confirmation using PayMongo with GCash for online-bookable services.
7. Evaluate the developed system using ISO/IEC 25010 software quality characteristics.

### Scope and Delimitation

This study covers the design and development of STABS, a web-based Smart Tourism Assistance and Booking System intended for tourism destinations in Gonzaga, Cagayan. The system includes destination pages, service package management, online booking, booking status tracking, tourist tickets, staff destination operations, and admin payout monitoring.

The implemented scope of the system includes the following:

- guest browsing of public pages
- destination listings and destination detail pages
- gallery viewing and cover images
- destination services and pricing
- public contact information for inquiry
- tourist account registration and login
- tourist email verification
- tourist password recovery
- service-based online booking
- visual availability calendar for online destinations
- temporary slot hold before payment
- PayMongo GCash checkout
- booking confirmation after successful payment
- tourist dashboard, booking history, booking calendar, and ticket wallet
- staff management of assigned destination information
- staff management of service packages
- service photos, date windows, and daily capacity
- service closure calendar
- staff booking monitoring and completion
- admin management of staff and tourist accounts
- admin financial and payout history management

The system is limited to tourism destination operations within Gonzaga, Cagayan. It does not include the following:

- airline ticketing
- intercity transport integration
- hotel marketplace aggregation outside Gonzaga
- refund workflow
- cancellation after successful payment
- admin-created offline walk-in bookings inside the system
- external multi-gateway payment options beyond the implemented PayMongo GCash flow
- advanced AI recommendation engine
- real-time GPS navigation

Walk-in destinations are also intentionally limited. When a destination is configured as walk-in, the system displays destination information, services, prices, and contact details only. Booking and payment for walk-in arrangements occur outside the system and therefore do not reduce online slot availability.

### Significance of the Study

This study is significant because it provides a practical tourism information and booking solution for Gonzaga, Cagayan.

**For Tourists**  
The system gives tourists one place to browse destination information, compare service packages, view prices, check availability, book online, and access tickets after confirmation.

**For Visitors without Accounts**  
The platform allows destination and service browsing without requiring registration. This supports visitors who only want to view prices, destination photos, or contact details before deciding to book.

**For Destination Staff**  
The system reduces manual coordination by allowing assigned staff to update destination details, upload media, manage services, set availability dates, close unavailable days, and monitor bookings from one workspace.

**For Administrators**  
The system provides centralized monitoring of staff accounts, tourist accounts, destination-linked payouts, and payout history without depending on separate offline spreadsheets.

**For the Municipality of Gonzaga**  
The study supports local digital tourism efforts by providing a working destination booking platform tailored to Gonzaga’s actual tourism operations.

**For Future Researchers and Developers**  
The project provides a reference for local tourism booking systems using a modern web stack, role-based workflows, integrated payments, and service-based availability logic.

### Definition of Terms

**STABS** – The Smart Tourism Assistance and Booking System developed in this study.

**Guest** – A visitor who can browse public destination information without creating an account.

**Tourist** – A registered user who can book online services and manage bookings.

**Staff** – A destination manager account assigned to one destination and responsible for service and destination maintenance.

**Admin** – The system-level manager who maintains staff accounts, tourist accounts, and payout records.

**Destination** – A tourism listing in Gonzaga presented in the system.

**Destination Service** – A specific bookable package or offering under a destination, including price, capacity, and service availability settings.

**Walk-in Destination** – A destination shown for public inquiry only, without online booking inside the system.

**Online Booking** – A reservation flow where a tourist selects a service, date, guest count, and completes payment online.

**Slot Hold** – A temporary reservation of capacity created before payment to prevent overbooking.

**Ticket** – The generated booking pass or booking code issued after successful confirmation.

**Payout Record** – An admin-side financial record used to track staff payout activity after paid bookings.

---

## CHAPTER II
## REVIEW OF RELATED LITERATURE

**Note:** This chapter should retain only sources that your group has already validated and approved. The section below updates the literature topics so they match the actual STABS system.

### 2.1 Web-Based Booking Systems

Recent tourism systems emphasize the value of web-based booking platforms in reducing manual coordination, improving reservation accuracy, and centralizing public information. In destination booking environments, users expect to compare available offerings, review service details, and complete reservations without depending entirely on manual inquiries. These systems improve operational efficiency and reduce the risk of overlapping reservations by using centralized availability logic and immediate booking updates.

**Synthesis**  
The literature supports the use of web-based booking systems for improving reservation efficiency, reducing manual workload, and strengthening destination accessibility. This supports STABS because the implemented system uses a centralized destination-service booking model instead of fragmented inquiry-based booking.

### 2.2 Destination Information and Tourist Assistance Platforms

Tourism platforms increasingly serve as public information hubs where visitors can view destination descriptions, media, services, and contact details before deciding to travel. In local tourism settings, assistance is often not limited to chat-based automation; it also includes providing organized information, updated public availability, and clear channels for inquiry. Public access to destination details can improve user confidence and reduce repetitive manual inquiries.

**Synthesis**  
The reviewed studies show that information quality, accessibility, and timely updates are important parts of tourist assistance. This aligns with STABS because the implemented system provides destination details, media, public contact information, service pricing, and availability visibility in a structured public interface.

### 2.3 Digital Payment Integration in Reservation Systems

Digital payment integration improves confirmation speed, transaction traceability, and user confidence in online reservation systems. In booking platforms, payment confirmation is especially important when capacity is limited because confirmed payment can be used as the basis for final reservation approval. Mobile wallet adoption also strengthens the feasibility of cashless booking in local tourism operations.

**Synthesis**  
The literature supports the use of digital payment confirmation to improve reservation control and reduce booking uncertainty. This is directly reflected in STABS, where online bookings are confirmed only after successful PayMongo GCash payment.

### 2.4 Role-Based Management in Information Systems

Role-based systems are widely used to separate responsibilities between public users, operational users, and system administrators. This improves system security, reduces interface complexity, and supports more organized workflows. In tourism systems, role separation is especially useful because destination operators and administrators do not perform the same tasks.

**Synthesis**  
The literature on role-based systems supports the implementation of separate dashboards and permissions. STABS follows this structure through guest access, tourist accounts, staff accounts, and admin accounts with different privileges and responsibilities.

### 2.5 Web Technologies for Local Tourism Platforms

Modern web systems increasingly use JavaScript frameworks, cloud databases, managed authentication, managed file storage, and hosted deployment platforms to reduce infrastructure complexity while improving responsiveness and maintainability. These tools are well suited for small-to-medium local tourism systems that require online access, media management, authentication, and transactional workflows.

**Synthesis**  
This supports the technical direction of STABS, which uses Next.js, Supabase, PayMongo, Brevo, and Vercel instead of the older PHP-and-local-server assumptions from the original manuscript.

---

## CHAPTER III
## TECHNICAL BACKGROUND

### Current System

Before the development of STABS, destination inquiries and reservations were handled through fragmented communication methods such as direct messages, calls, walk-in inquiries, and manual confirmation with individual destination managers. Visitors could ask for prices or schedules, but there was no single platform where they could compare destinations, review service packages, or see structured booking status.

Service availability was not managed through a centralized booking system. Booking confirmation depended on direct coordination, which increased the chance of inconsistent replies, delayed confirmation, and untracked reservation activity. Destination records, photos, and service updates also depended on manual posting or staff-side social media activity instead of a dedicated management platform.

On the administrative side, there was no integrated system for monitoring platform-level destination activity, tourist booking history, or destination payout records. This made it difficult to separate public browsing, destination operations, and administrative payout tracking in one organized workflow.

These limitations justified the development of a system that could:

- centralize destination content
- support public browsing without forcing registration
- confirm bookings only after payment
- protect limited capacity
- assign one destination to each staff account
- separate admin financial monitoring from staff operations

### System Requirements

The system requirements of STABS are grouped into hardware, software, and peopleware.

#### Hardware Requirements

| Aspect | Minimum Requirement |
|---|---|
| Development Computer | Intel i5 / Ryzen 5 or equivalent, 8 GB RAM, 128 GB SSD |
| End-User Desktop/Laptop | Dual-core processor, 4 GB RAM, modern browser |
| Mobile Device | Android 8+ or iOS 12+ with modern browser |
| Internet Connection | Stable broadband or mobile data connection |

#### Software Requirements

| Aspect | Implemented Requirement |
|---|---|
| Operating System | Windows 10/11, macOS, or Linux |
| Frontend Framework | Next.js 15 with React 19 |
| Backend | Next.js App Router with Route Handlers |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| Payment Gateway | PayMongo (GCash) |
| Email Delivery | Brevo SMTP through Supabase Auth |
| Deployment | Vercel |
| Development Tools | Visual Studio Code, Node.js, npm |
| Browser Support | Google Chrome, Microsoft Edge, Mozilla Firefox, Safari |

#### Peopleware

| User Type | Role in the System |
|---|---|
| Guest / Visitor | Browses destinations, services, prices, and contact details |
| Tourist | Registers, books services, pays online, views tickets and booking history |
| Staff | Manages one assigned destination, services, schedules, and bookings |
| Admin | Manages staff and tourist accounts, payout records, and payout history |

### System Architecture

STABS follows a modern web application architecture composed of the following components:

1. **Client Interface**  
   Tourists, staff, admin, and guests access the platform through a responsive web browser interface.

2. **Application Layer**  
   The frontend and backend are both handled by Next.js. Public pages, dashboards, and API routes are served through the same application.

3. **Authentication Layer**  
   Supabase Auth manages user sessions, tourist email verification, staff/admin account identity, and password recovery.

4. **Database Layer**  
   Supabase PostgreSQL stores users, staff profiles, destinations, services, bookings, payments, slot locks, feedback entries, and financial records.

5. **Storage Layer**  
   Supabase Storage stores avatars, destination covers, gallery images, and service images.

6. **Payment Layer**  
   PayMongo processes GCash payments for online reservations.

7. **Email Layer**  
   Brevo SMTP is connected through Supabase Auth for tourist email verification and tourist password recovery.

8. **Deployment Layer**  
   The application is deployed through Vercel.

**Narrative Flow**

- Guests browse public destination pages.
- Tourists sign in only when ready to reserve.
- The system checks service availability and creates a temporary slot hold.
- The tourist completes GCash checkout through PayMongo.
- After successful payment, the booking is confirmed and a ticket is issued.
- Staff manage destination operations and mark completed bookings.
- Admin monitors payout records and settlement history.

**Note for manuscript figure:**  
Replace the old architecture diagram with a diagram that shows:
Browser -> Next.js App -> Supabase Auth/Database/Storage + PayMongo + Brevo -> Role-based dashboards.

---

## CHAPTER IV
## RESEARCH METHODOLOGY

### Research Design

This study used a descriptive-developmental research design. The descriptive aspect was used to understand the existing destination inquiry and booking practices in Gonzaga and to identify operational limitations such as fragmented communication, manual confirmation, and lack of centralized records. The developmental aspect covered the analysis, design, implementation, testing, and refinement of STABS.

### Instrumentation

The researchers used the following instruments:

1. **Interview** – to identify the operational issues faced by stakeholders and destination operators.
2. **Observation** – to review the current inquiry, booking, and coordination process.
3. **Questionnaire** – to evaluate the system based on ISO/IEC 25010 software quality characteristics.

### Data Gathering Procedure

1. Preparation of formal request letters and research approval.
2. Coordination with the concerned local stakeholders and respondents.
3. Conduct of interviews and observation of the existing process.
4. Identification of system requirements and workflow needs.
5. Development of STABS based on the collected requirements.
6. Testing and evaluation of the system using the chosen software quality criteria.

### Participants of the Study

The study involved three groups of participants:

- tourists
- destination or tourism-related staff
- IT experts or evaluators

If your approved participant counts remain the same as in the original manuscript, retain the original table. If the actual composition changed, update the table accordingly.

### Data Analysis

The system may still be evaluated using ISO/IEC 25010 software quality characteristics:

- Functional Suitability
- Performance Efficiency
- Compatibility
- Usability
- Reliability
- Security
- Maintainability
- Portability

Weighted mean and Likert-scale interpretation may be retained from the original manuscript if those were already approved by your adviser.

### Requirement Documentation

#### System Requirements Summary

STABS is a role-based Gonzaga destination booking system that centralizes destination information, service packages, booking availability, payment confirmation, and destination operations into one web platform. The system provides:

- public destination browsing
- service-based booking
- tourist account management
- GCash payment confirmation
- tourist booking records and tickets
- staff destination operations
- admin payout monitoring

#### Functional Requirements

The system shall:

1. Allow guests to browse destinations, services, pricing, media, and contact details without creating an account.
2. Allow tourists to register, verify email, sign in, and recover passwords.
3. Allow tourists to book an available destination service online.
4. Display a visual availability calendar for online-bookable services.
5. Create temporary slot holds before payment.
6. Confirm bookings only after successful PayMongo GCash payment.
7. Generate a ticket code for confirmed bookings.
8. Allow tourists to view booking history, a booking calendar, and downloadable tickets.
9. Allow staff to manage one assigned destination.
10. Allow staff to update destination details, cover images, galleries, and contact details.
11. Allow staff to create, edit, activate, deactivate, and delete service packages.
12. Allow staff to define daily capacity, date windows, and closed dates for services.
13. Allow staff to view bookings and mark eligible bookings as completed.
14. Allow admin to create staff accounts.
15. Allow admin to reset staff passwords.
16. Allow admin to manage tourist and staff access.
17. Allow admin to monitor financial payout records and payout history.
18. Allow public walk-in destinations to show information and contact details without online booking.

#### Non-Functional Requirements

**Functional Suitability**  
The system shall correctly support public browsing, tourist booking, staff destination management, and admin payout monitoring.

**Performance Efficiency**  
The system shall load public and private pages under normal network conditions with acceptable response time for local use.

**Compatibility**  
The system shall operate on modern desktop and mobile browsers.

**Usability**  
The system shall provide role-based dashboards, readable mobile layouts, and clear navigation for guests, tourists, staff, and admin.

**Reliability**  
The system shall preserve booking, payment, and destination records with consistent behavior across normal user workflows.

**Security**  
The system shall implement authentication, role-based access control, data validation, session handling, and payment verification.

**Maintainability**  
The system shall use modular components, typed models, structured API routes, and centralized repository logic to support future updates.

**Portability**  
The system shall be deployable through a cloud platform and remain testable in a local development environment.

### Updated System Modules

To align the manuscript with the actual developed project, the system modules should now be described as:

1. **Public Browsing Module**
   - home page
   - destination list
   - destination details
   - feedback page
   - about page

2. **Tourist Account Module**
   - sign up
   - sign in
   - email verification
   - password recovery
   - active bookings
   - booking history
   - booking calendar
   - ticket wallet

3. **Booking and Payment Module**
   - service selection
   - visual date availability
   - guest count
   - temporary slot hold
   - PayMongo GCash checkout
   - booking confirmation and ticket issuance

4. **Staff Destination Management Module**
   - destination profile
   - gallery and cover media
   - public contact details
   - service package management
   - availability date range
   - closed-date calendar
   - booking completion

5. **Admin Management Module**
   - staff account management
   - tourist account management
   - payout workspace
   - payout history

### Notes for Final Manuscript Formatting

Before final submission, your group should still:

1. Replace old system figures with updated STABS diagrams.
2. Remove outdated references to PHP, Bootstrap, jQuery, Apache, online banking, itinerary planning, and multi-platform smart assistance if they are not part of the implemented system.
3. Update Chapter II citations so they match the final system scope and the sources approved by your adviser.
4. Align all figure captions, tables, and terminology with the final system name you will officially use:
   - **STABS**
   - **Smart Tourism Assistance and Booking System**
   - or **STABS**

---

## Recommended Final System Description

If your panel asks for a one-paragraph summary, you can use this:

> STABS is a web-based Smart Tourism Assistance and Booking System that centralizes destination browsing, service package management, online reservation, GCash payment confirmation, tourist tickets, staff destination operations, and admin payout monitoring. The system supports guest browsing, tourist accounts, assigned staff management, and administrator oversight through a responsive platform built with modern web technologies.
