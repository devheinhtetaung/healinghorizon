/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.8-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: healinghorizon
-- ------------------------------------------------------
-- Server version	11.8.8-MariaDB-0+deb13u1 from Debian

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `AIChatBot`
--

DROP TABLE IF EXISTS `AIChatBot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AIChatBot` (
  `botId` int(11) NOT NULL AUTO_INCREMENT,
  `botName` varchar(255) NOT NULL,
  PRIMARY KEY (`botId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Admin`
--

DROP TABLE IF EXISTS `Admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Admin` (
  `adminId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`adminId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `fk_admin_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `AdminConsultant`
--

DROP TABLE IF EXISTS `AdminConsultant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AdminConsultant` (
  `adminId` int(11) NOT NULL,
  `consultantId` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`adminId`,`consultantId`),
  KEY `fk_ac_consultant` (`consultantId`),
  CONSTRAINT `fk_ac_admin` FOREIGN KEY (`adminId`) REFERENCES `Admin` (`adminId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ac_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant` (`consultantId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Appointment`
--

DROP TABLE IF EXISTS `Appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Appointment` (
  `appointmentId` int(11) NOT NULL AUTO_INCREMENT,
  `patientId` int(11) NOT NULL,
  `consultantId` int(11) NOT NULL,
  `appointmentDate` date NOT NULL,
  `appointmentTime` time NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  `declineReason` varchar(255) DEFAULT NULL,
  `conferenceId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`appointmentId`),
  KEY `idx_appointment_patientId` (`patientId`),
  KEY `idx_appointment_consultantId` (`consultantId`),
  KEY `idx_appointment_conferenceId` (`conferenceId`),
  CONSTRAINT `fk_appointment_conference` FOREIGN KEY (`conferenceId`) REFERENCES `VideoConference` (`conferenceId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant` (`consultantId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient` (`patientId`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChatMessage`
--

DROP TABLE IF EXISTS `ChatMessage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ChatMessage` (
  `messageId` int(11) NOT NULL AUTO_INCREMENT,
  `conversationId` int(11) DEFAULT NULL,
  `patientId` int(11) NOT NULL,
  `botId` int(11) NOT NULL,
  `sender` enum('patient','bot') NOT NULL,
  `message` text NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`messageId`),
  KEY `idx_chatmessage_conversationId` (`conversationId`),
  KEY `idx_chatmessage_patientId` (`patientId`),
  KEY `idx_chatmessage_botId` (`botId`),
  CONSTRAINT `fk_chatmessage_bot` FOREIGN KEY (`botId`) REFERENCES `AIChatBot` (`botId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chatmessage_conversation` FOREIGN KEY (`conversationId`) REFERENCES `Conversation` (`conversationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_chatmessage_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient` (`patientId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChatSummary`
--

DROP TABLE IF EXISTS `ChatSummary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ChatSummary` (
  `summaryId` int(11) NOT NULL AUTO_INCREMENT,
  `patientId` int(11) NOT NULL,
  `summary` text NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`summaryId`),
  KEY `idx_chatsummary_patientId` (`patientId`),
  CONSTRAINT `fk_chatsummary_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient` (`patientId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Comment`
--

DROP TABLE IF EXISTS `Comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Comment` (
  `commentId` int(11) NOT NULL AUTO_INCREMENT,
  `postId` int(11) NOT NULL,
  `commentBy` int(11) NOT NULL,
  `comment` text NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`commentId`),
  KEY `idx_comment_postId` (`postId`),
  KEY `idx_comment_commentBy` (`commentBy`),
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`postId`) REFERENCES `CommunityPost` (`postId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`commentBy`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `CommunityPost`
--

DROP TABLE IF EXISTS `CommunityPost`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CommunityPost` (
  `postId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `postTitle` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `anonymousPost` tinyint(1) NOT NULL DEFAULT 0,
  `hasAttachment` tinyint(1) NOT NULL DEFAULT 0,
  `upVoteCount` int(10) unsigned NOT NULL DEFAULT 0,
  `viewCount` int(10) unsigned NOT NULL DEFAULT 0,
  `shareCount` int(10) unsigned NOT NULL DEFAULT 0,
  `commentCount` int(10) unsigned NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`postId`),
  KEY `idx_communitypost_userId` (`userId`),
  CONSTRAINT `fk_communitypost_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Consultant`
--

DROP TABLE IF EXISTS `Consultant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Consultant` (
  `consultantId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `biography` text DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `isVerified` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`consultantId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `fk_consultant_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ConsultantAvailability`
--

DROP TABLE IF EXISTS `ConsultantAvailability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ConsultantAvailability` (
  `availabilityId` int(11) NOT NULL AUTO_INCREMENT,
  `consultantId` int(11) NOT NULL,
  `dayOfWeek` tinyint(4) NOT NULL,
  `isAvailable` tinyint(1) NOT NULL DEFAULT 1,
  `startTime` time DEFAULT NULL,
  `endTime` time DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`availabilityId`),
  UNIQUE KEY `uq_avail_consultant_day` (`consultantId`,`dayOfWeek`),
  CONSTRAINT `fk_avail_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant` (`consultantId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ConsultantAvailabilityOverride`
--

DROP TABLE IF EXISTS `ConsultantAvailabilityOverride`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ConsultantAvailabilityOverride` (
  `overrideId` int(11) NOT NULL AUTO_INCREMENT,
  `consultantId` int(11) NOT NULL,
  `overrideDate` date NOT NULL,
  `isAvailable` tinyint(1) NOT NULL DEFAULT 0,
  `startTime` time DEFAULT NULL,
  `endTime` time DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`overrideId`),
  UNIQUE KEY `uq_availo_consultant_date` (`consultantId`,`overrideDate`),
  CONSTRAINT `fk_availo_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant` (`consultantId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Conversation`
--

DROP TABLE IF EXISTS `Conversation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Conversation` (
  `conversationId` int(11) NOT NULL AUTO_INCREMENT,
  `patientId` int(11) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'New conversation',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`conversationId`),
  KEY `idx_conversation_patientId` (`patientId`),
  CONSTRAINT `fk_conversation_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient` (`patientId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Donation`
--

DROP TABLE IF EXISTS `Donation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Donation` (
  `donationId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `anonymousDonation` tinyint(1) NOT NULL DEFAULT 0,
  `donarName` varchar(255) DEFAULT NULL,
  `donarEmail` varchar(255) DEFAULT NULL,
  `status` enum('pending','completed','failed') NOT NULL DEFAULT 'completed',
  `donatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`donationId`),
  KEY `idx_donation_userId` (`userId`),
  CONSTRAINT `fk_donation_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Feedback`
--

DROP TABLE IF EXISTS `Feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Feedback` (
  `feedbackId` int(11) NOT NULL AUTO_INCREMENT,
  `appointmentId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `consultantId` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`feedbackId`),
  UNIQUE KEY `appointmentId` (`appointmentId`),
  KEY `fk_feedback_patient` (`patientId`),
  KEY `idx_feedback_consultantId` (`consultantId`),
  CONSTRAINT `fk_feedback_appointment` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment` (`appointmentId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedback_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant` (`consultantId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedback_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient` (`patientId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Hospital`
--

DROP TABLE IF EXISTS `Hospital`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Hospital` (
  `hospitalId` int(11) NOT NULL AUTO_INCREMENT,
  `adminId` int(11) NOT NULL,
  `hospitalName` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`hospitalId`),
  KEY `fk_hospital_admin` (`adminId`),
  KEY `idx_hospital_city` (`city`),
  CONSTRAINT `fk_hospital_admin` FOREIGN KEY (`adminId`) REFERENCES `Admin` (`adminId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `notificationId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `message` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notificationId`),
  KEY `idx_notification_userId` (`userId`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Patient`
--

DROP TABLE IF EXISTS `Patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Patient` (
  `patientId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `supportPreference` varchar(255) DEFAULT NULL,
  `emailNotification` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`patientId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `fk_patient_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `PatientProgressLog`
--

DROP TABLE IF EXISTS `PatientProgressLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `PatientProgressLog` (
  `progressId` int(11) NOT NULL AUTO_INCREMENT,
  `patientId` int(11) NOT NULL,
  `consultantId` int(11) NOT NULL,
  `anxietyScore` decimal(5,2) DEFAULT 0.00,
  `depressionScore` decimal(5,2) DEFAULT 0.00,
  `overthinkingScore` decimal(5,2) DEFAULT 0.00,
  `overallScore` decimal(5,2) DEFAULT 0.00,
  `note` text DEFAULT NULL,
  `loggedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`progressId`),
  KEY `idx_progress_patientId` (`patientId`),
  KEY `idx_progress_consultantId` (`consultantId`),
  CONSTRAINT `fk_progress_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant` (`consultantId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_progress_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient` (`patientId`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `PostReport`
--

DROP TABLE IF EXISTS `PostReport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `PostReport` (
  `postReportId` int(11) NOT NULL AUTO_INCREMENT,
  `postId` int(11) NOT NULL,
  `reporterId` int(11) NOT NULL,
  `reason` enum('spam','harmful','harassment','other') NOT NULL,
  `status` enum('open','resolved','dismissed') NOT NULL DEFAULT 'open',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`postReportId`),
  UNIQUE KEY `uq_postreport_reporter_post` (`reporterId`,`postId`),
  KEY `idx_postreport_postId` (`postId`),
  KEY `idx_postreport_status` (`status`),
  CONSTRAINT `fk_postreport_post` FOREIGN KEY (`postId`) REFERENCES `CommunityPost` (`postId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_postreport_reporter` FOREIGN KEY (`reporterId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `PostUpvote`
--

DROP TABLE IF EXISTS `PostUpvote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `PostUpvote` (
  `postUpvoteId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `postId` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`postUpvoteId`),
  UNIQUE KEY `uq_postupvote_user_post` (`userId`,`postId`),
  KEY `fk_postupvote_post` (`postId`),
  CONSTRAINT `fk_postupvote_post` FOREIGN KEY (`postId`) REFERENCES `CommunityPost` (`postId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_postupvote_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Psychiatrists`
--

DROP TABLE IF EXISTS `Psychiatrists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Psychiatrists` (
  `psychiatristId` int(11) NOT NULL AUTO_INCREMENT,
  `hospitalId` int(11) NOT NULL,
  `psychiatristName` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`psychiatristId`),
  KEY `fk_psychiatrist_hospital` (`hospitalId`),
  CONSTRAINT `fk_psychiatrist_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital` (`hospitalId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Referral`
--

DROP TABLE IF EXISTS `Referral`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Referral` (
  `referralId` int(11) NOT NULL AUTO_INCREMENT,
  `consultantId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `caseOfReferral` text NOT NULL,
  `referToConsultantId` int(11) DEFAULT NULL,
  `referToPsychiatristId` int(11) DEFAULT NULL,
  `status` enum('pending','accepted','completed') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`referralId`),
  KEY `fk_referral_toConsultant` (`referToConsultantId`),
  KEY `fk_referral_toPsychiatrist` (`referToPsychiatristId`),
  KEY `idx_referral_consultantId` (`consultantId`),
  KEY `idx_referral_patientId` (`patientId`),
  CONSTRAINT `fk_referral_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient` (`patientId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_referral_referredBy` FOREIGN KEY (`consultantId`) REFERENCES `Consultant` (`consultantId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_referral_toConsultant` FOREIGN KEY (`referToConsultantId`) REFERENCES `Consultant` (`consultantId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_referral_toPsychiatrist` FOREIGN KEY (`referToPsychiatristId`) REFERENCES `Psychiatrists` (`psychiatristId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SessionSummary`
--

DROP TABLE IF EXISTS `SessionSummary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SessionSummary` (
  `summaryId` int(11) NOT NULL AUTO_INCREMENT,
  `appointmentId` int(11) NOT NULL,
  `consultantId` int(11) NOT NULL,
  `content` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`summaryId`),
  UNIQUE KEY `appointmentId` (`appointmentId`),
  KEY `idx_sessionsummary_consultantId` (`consultantId`),
  CONSTRAINT `fk_sessionsummary_appointment` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment` (`appointmentId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sessionsummary_consultant` FOREIGN KEY (`consultantId`) REFERENCES `Consultant` (`consultantId`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Survey`
--

DROP TABLE IF EXISTS `Survey`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Survey` (
  `surveyId` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `createdByAdminId` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`surveyId`),
  KEY `fk_survey_admin` (`createdByAdminId`),
  CONSTRAINT `fk_survey_admin` FOREIGN KEY (`createdByAdminId`) REFERENCES `Admin` (`adminId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SurveyQuestions`
--

DROP TABLE IF EXISTS `SurveyQuestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SurveyQuestions` (
  `questionId` int(11) NOT NULL AUTO_INCREMENT,
  `surveyId` int(11) NOT NULL,
  `question` text NOT NULL,
  `type` enum('multiple_choice','scale','text') NOT NULL DEFAULT 'text',
  `options` text DEFAULT NULL,
  PRIMARY KEY (`questionId`),
  KEY `idx_sq_surveyId` (`surveyId`),
  CONSTRAINT `fk_sq_survey` FOREIGN KEY (`surveyId`) REFERENCES `Survey` (`surveyId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SurveyResponse`
--

DROP TABLE IF EXISTS `SurveyResponse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SurveyResponse` (
  `responseId` int(11) NOT NULL AUTO_INCREMENT,
  `questionId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `answer` text NOT NULL,
  `submittedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`responseId`),
  UNIQUE KEY `uq_sr_question_patient` (`questionId`,`patientId`),
  KEY `idx_sr_patientId` (`patientId`),
  CONSTRAINT `fk_sr_patient` FOREIGN KEY (`patientId`) REFERENCES `Patient` (`patientId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sr_question` FOREIGN KEY (`questionId`) REFERENCES `SurveyQuestions` (`questionId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `userId` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('patient','consultant','admin') NOT NULL,
  `gender` enum('Male','Female') DEFAULT NULL,
  `dob` date NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  `isBanned` tinyint(1) NOT NULL DEFAULT 0,
  `banReason` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`userId`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `VideoConference`
--

DROP TABLE IF EXISTS `VideoConference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `VideoConference` (
  `conferenceId` int(11) NOT NULL AUTO_INCREMENT,
  `roomName` varchar(255) NOT NULL,
  `status` enum('scheduled','ongoing','ended') NOT NULL DEFAULT 'scheduled',
  `patientJoinedAt` datetime DEFAULT NULL,
  `consultantJoinedAt` datetime DEFAULT NULL,
  `patientLeftAt` datetime DEFAULT NULL,
  `consultantLeftAt` datetime DEFAULT NULL,
  `startedAt` datetime DEFAULT NULL,
  `endedAt` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`conferenceId`),
  UNIQUE KEY `roomName` (`roomName`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-09-26 15:19:37
