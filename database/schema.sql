CREATE DATABASE IF NOT EXISTS `healinghorizon`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `healinghorizon`;

-- ============ Users & Roles ============

CREATE TABLE IF NOT EXISTS `Users` (
    `userId`        INT PRIMARY KEY AUTO_INCREMENT,
    `name`          VARCHAR(255) NOT NULL,
    `email`         VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role`          ENUM('patient','consultant','admin') NOT NULL,
    `gender`        ENUM('Male','Female'),
    `dob`           DATE NOT NULL,
    `address`       VARCHAR(255),
    `avatarUrl`     VARCHAR(255) NULL,
    `isBanned`      TINYINT(1) NOT NULL DEFAULT 0,
    `banReason`     VARCHAR(255),
    `createdAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Patient` (
    `patientId`         INT PRIMARY KEY AUTO_INCREMENT,
    `userId`            INT NOT NULL UNIQUE,
    `supportPreference` VARCHAR(255),
    `emailNotification` TINYINT(1) NOT NULL DEFAULT 1,
    `createdAt`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_patient_user` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Consultant` (
    `consultantId` INT PRIMARY KEY AUTO_INCREMENT,
    `userId`       INT NOT NULL UNIQUE,
    `biography`    TEXT,
    `rating`       DECIMAL(3,2) DEFAULT 0.00,
    `isVerified`   TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_consultant_user` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Consultant Availability ============

-- Recurring weekly hours: one row per consultant per day-of-week.
-- dayOfWeek follows PHP/JS convention (0 = Sunday .. 6 = Saturday).
-- isAvailable = 0 means the consultant is not bookable that weekday.
CREATE TABLE IF NOT EXISTS `ConsultantAvailability` (
    `availabilityId` INT PRIMARY KEY AUTO_INCREMENT,
    `consultantId`   INT NOT NULL,
    `dayOfWeek`      TINYINT NOT NULL,
    `isAvailable`    TINYINT(1) NOT NULL DEFAULT 1,
    `startTime`      TIME NULL,
    `endTime`        TIME NULL,
    `createdAt`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_avail_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant`(`consultantId`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uq_avail_consultant_day` (`consultantId`, `dayOfWeek`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Date-specific overrides win over the recurring schedule.
-- isAvailable = 0 → the whole day is blocked (vacation/sick day).
-- isAvailable = 1 → custom open time range (extra hours) replaces the
--   recurring range for that date.
CREATE TABLE IF NOT EXISTS `ConsultantAvailabilityOverride` (
    `overrideId`   INT PRIMARY KEY AUTO_INCREMENT,
    `consultantId` INT NOT NULL,
    `overrideDate` DATE NOT NULL,
    `isAvailable`  TINYINT(1) NOT NULL DEFAULT 0,
    `startTime`    TIME NULL,
    `endTime`      TIME NULL,
    `createdAt`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_availo_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant`(`consultantId`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uq_availo_consultant_date` (`consultantId`, `overrideDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Admin` (
    `adminId`   INT PRIMARY KEY AUTO_INCREMENT,
    `userId`    INT NOT NULL UNIQUE,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_admin_user` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Directory ============

CREATE TABLE IF NOT EXISTS `Hospital` (
    `hospitalId`   INT PRIMARY KEY AUTO_INCREMENT,
    `adminId`      INT NOT NULL,
    `hospitalName` VARCHAR(255) NOT NULL,
    `city`         VARCHAR(255) NOT NULL,
    `address`      VARCHAR(255),
    `createdAt`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_hospital_admin` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`adminId`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_hospital_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Psychiatrists` (
    `psychiatristId`   INT PRIMARY KEY AUTO_INCREMENT,
    `hospitalId`       INT NOT NULL,
    `psychiatristName` VARCHAR(255) NOT NULL,
    `createdAt`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_psychiatrist_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AdminConsultant` (
    `adminId`      INT NOT NULL,
    `consultantId` INT NOT NULL,
    `createdAt`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`adminId`, `consultantId`),
    CONSTRAINT `fk_ac_admin` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`adminId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ac_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant`(`consultantId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ AI Chatbot ============

CREATE TABLE IF NOT EXISTS `Conversation` (
    `conversationId` INT PRIMARY KEY AUTO_INCREMENT,
    `patientId`      INT NOT NULL,
    `title`          VARCHAR(255) NOT NULL DEFAULT 'New conversation',
    `createdAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_conversation_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`patientId`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_conversation_patientId` (`patientId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AIChatBot` (
    `botId`   INT PRIMARY KEY AUTO_INCREMENT,
    `botName` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ChatMessage` (
    `messageId`      INT PRIMARY KEY AUTO_INCREMENT,
    `conversationId` INT NULL,
    `patientId`      INT NOT NULL,
    `botId`          INT NOT NULL,
    `sender`         ENUM('patient','bot') NOT NULL,
    `message`        TEXT NOT NULL,
    `createdAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_chatmessage_conversation` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`conversationId`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_chatmessage_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`patientId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_chatmessage_bot` FOREIGN KEY (`botId`) REFERENCES `AIChatBot`(`botId`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_chatmessage_conversationId` (`conversationId`),
    INDEX `idx_chatmessage_patientId` (`patientId`),
    INDEX `idx_chatmessage_botId` (`botId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Surveys ============

CREATE TABLE IF NOT EXISTS `Survey` (
    `surveyId`         INT PRIMARY KEY AUTO_INCREMENT,
    `title`            VARCHAR(255) NOT NULL,
    `createdByAdminId` INT NOT NULL,
    `createdAt`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_survey_admin` FOREIGN KEY (`createdByAdminId`) REFERENCES `Admin`(`adminId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SurveyQuestions` (
    `questionId` INT PRIMARY KEY AUTO_INCREMENT,
    `surveyId`   INT NOT NULL,
    `question`   TEXT NOT NULL,
    `type`       ENUM('multiple_choice','scale','text') NOT NULL DEFAULT 'text',
    `options`    TEXT NULL,
    CONSTRAINT `fk_sq_survey` FOREIGN KEY (`surveyId`) REFERENCES `Survey`(`surveyId`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_sq_surveyId` (`surveyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SurveyResponse` (
    `responseId`  INT PRIMARY KEY AUTO_INCREMENT,
    `questionId`  INT NOT NULL,
    `patientId`   INT NOT NULL,
    `answer`      TEXT NOT NULL,
    `submittedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sr_question` FOREIGN KEY (`questionId`) REFERENCES `SurveyQuestions`(`questionId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sr_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`patientId`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uq_sr_question_patient` (`questionId`, `patientId`),
    INDEX `idx_sr_patientId` (`patientId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Appointments & Video ============

CREATE TABLE IF NOT EXISTS `VideoConference` (
    `conferenceId`       INT PRIMARY KEY AUTO_INCREMENT,
    `roomName`           VARCHAR(255) NOT NULL UNIQUE,
    `status`             ENUM('scheduled','ongoing','ended') NOT NULL DEFAULT 'scheduled',
    `patientJoinedAt`    DATETIME,
    `consultantJoinedAt` DATETIME,
    `patientLeftAt`      DATETIME,
    `consultantLeftAt`   DATETIME,
    `startedAt`          DATETIME,
    `endedAt`            DATETIME,
    `createdAt`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Appointment` (
    `appointmentId`   INT PRIMARY KEY AUTO_INCREMENT,
    `patientId`       INT NOT NULL,
    `consultantId`    INT NOT NULL,
    `appointmentDate` DATE NOT NULL,
    `appointmentTime` TIME NOT NULL,
    `status`          ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
    `declineReason`   VARCHAR(255) NULL,
    `conferenceId`    INT,
    `createdAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_appointment_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_appointment_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant`(`consultantId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_appointment_conference` FOREIGN KEY (`conferenceId`) REFERENCES `VideoConference`(`conferenceId`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_appointment_patientId` (`patientId`),
    INDEX `idx_appointment_consultantId` (`consultantId`),
    INDEX `idx_appointment_conferenceId` (`conferenceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Feedback ============

CREATE TABLE IF NOT EXISTS `Feedback` (
    `feedbackId`    INT PRIMARY KEY AUTO_INCREMENT,
    `appointmentId` INT NOT NULL UNIQUE,
    `patientId`     INT NOT NULL,
    `consultantId`  INT NOT NULL,
    `rating`        TINYINT NOT NULL,
    `comment`       TEXT,
    `createdAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_feedback_appointment` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`appointmentId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_feedback_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`patientId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_feedback_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant`(`consultantId`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_feedback_consultantId` (`consultantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Session Summaries ============

CREATE TABLE IF NOT EXISTS `SessionSummary` (
    `summaryId`     INT PRIMARY KEY AUTO_INCREMENT,
    `appointmentId` INT NOT NULL UNIQUE,
    `consultantId`  INT NOT NULL,
    `content`       TEXT NOT NULL,
    `createdAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sessionsummary_appointment` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`appointmentId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sessionsummary_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant`(`consultantId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_sessionsummary_consultantId` (`consultantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Community ============

CREATE TABLE IF NOT EXISTS `CommunityPost` (
    `postId`        INT PRIMARY KEY AUTO_INCREMENT,
    `userId`        INT NOT NULL,
    `postTitle`     VARCHAR(255) NOT NULL,
    `content`       TEXT NOT NULL,
    `anonymousPost` TINYINT(1) NOT NULL DEFAULT 0,
    `hasAttachment` TINYINT(1) NOT NULL DEFAULT 0,
    `upVoteCount`   INT UNSIGNED NOT NULL DEFAULT 0,
    `viewCount`     INT UNSIGNED NOT NULL DEFAULT 0,
    `shareCount`    INT UNSIGNED NOT NULL DEFAULT 0,
    `commentCount`  INT UNSIGNED NOT NULL DEFAULT 0,
    `createdAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_communitypost_user` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_communitypost_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PostUpvote` (
    `postUpvoteId` INT PRIMARY KEY AUTO_INCREMENT,
    `userId`       INT NOT NULL,
    `postId`       INT NOT NULL,
    `createdAt`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_postupvote_user` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_postupvote_post` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`postId`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uq_postupvote_user_post` (`userId`, `postId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Comment` (
    `commentId` INT PRIMARY KEY AUTO_INCREMENT,
    `postId`    INT NOT NULL,
    `commentBy` INT NOT NULL,
    `comment`   TEXT NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_comment_post` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`postId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_comment_user` FOREIGN KEY (`commentBy`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_comment_postId` (`postId`),
    INDEX `idx_comment_commentBy` (`commentBy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Post Reports ============

CREATE TABLE IF NOT EXISTS `PostReport` (
    `postReportId` INT PRIMARY KEY AUTO_INCREMENT,
    `postId`       INT NOT NULL,
    `reporterId`   INT NOT NULL,
    `reason`       ENUM('spam','harmful','harassment','other') NOT NULL,
    `status`       ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
    `createdAt`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_postreport_post` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`postId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_postreport_reporter` FOREIGN KEY (`reporterId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uq_postreport_reporter_post` (`reporterId`, `postId`),
    INDEX `idx_postreport_postId` (`postId`),
    INDEX `idx_postreport_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Donations ============

CREATE TABLE IF NOT EXISTS `Donation` (
    `donationId`        INT PRIMARY KEY AUTO_INCREMENT,
    `userId`            INT NULL,
    `amount`            DECIMAL(10,2) NOT NULL,
    `anonymousDonation` TINYINT(1) NOT NULL DEFAULT 0,
    `donarName`         VARCHAR(255),
    `donarEmail`        VARCHAR(255),
    `status`            ENUM('pending','completed','failed') NOT NULL DEFAULT 'completed',
    `donatedAt`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_donation_user` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_donation_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Referrals ============

CREATE TABLE IF NOT EXISTS `Referral` (
    `referralId`             INT PRIMARY KEY AUTO_INCREMENT,
    `consultantId`           INT NOT NULL,
    `patientId`              INT NOT NULL,
    `caseOfReferral`         TEXT NOT NULL,
    `referToConsultantId`    INT NULL,
    `referToPsychiatristId`  INT NULL,
    `status`                 ENUM('pending','accepted','completed') NOT NULL DEFAULT 'pending',
    `createdAt`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_referral_referredBy` FOREIGN KEY (`consultantId`) REFERENCES `Consultant`(`consultantId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_referral_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`patientId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_referral_toConsultant` FOREIGN KEY (`referToConsultantId`) REFERENCES `Consultant`(`consultantId`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_referral_toPsychiatrist` FOREIGN KEY (`referToPsychiatristId`) REFERENCES `Psychiatrists`(`psychiatristId`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_referral_consultantId` (`consultantId`),
    INDEX `idx_referral_patientId` (`patientId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Progress Logs ============

CREATE TABLE IF NOT EXISTS `PatientProgressLog` (
    `progressId`        INT PRIMARY KEY AUTO_INCREMENT,
    `patientId`         INT NOT NULL,
    `consultantId`      INT NOT NULL,
    `anxietyScore`      DECIMAL(5,2) DEFAULT 0.00,
    `depressionScore`   DECIMAL(5,2) DEFAULT 0.00,
    `overthinkingScore` DECIMAL(5,2) DEFAULT 0.00,
    `overallScore`      DECIMAL(5,2) DEFAULT 0.00,
    `note`              TEXT,
    `loggedAt`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_progress_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_progress_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant`(`consultantId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_progress_patientId` (`patientId`),
    INDEX `idx_progress_consultantId` (`consultantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Chat Summaries ============

CREATE TABLE IF NOT EXISTS `ChatSummary` (
    `summaryId`  INT PRIMARY KEY AUTO_INCREMENT,
    `patientId`  INT NOT NULL,
    `summary`    TEXT NOT NULL,
    `createdAt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_chatsummary_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`patientId`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_chatsummary_patientId` (`patientId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ Notifications ============

CREATE TABLE IF NOT EXISTS `Notification` (
    `notificationId` INT PRIMARY KEY AUTO_INCREMENT,
    `userId`         INT NOT NULL,
    `message`        TEXT NOT NULL,
    `isRead`         TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_notification_user` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_notification_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
