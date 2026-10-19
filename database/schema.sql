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
-- Dumping data for table `AIChatBot`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `AIChatBot` WRITE;
/*!40000 ALTER TABLE `AIChatBot` DISABLE KEYS */;
INSERT INTO `AIChatBot` VALUES
(1,'Horizon Companion');
/*!40000 ALTER TABLE `AIChatBot` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
-- Dumping data for table `Admin`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Admin` WRITE;
/*!40000 ALTER TABLE `Admin` DISABLE KEYS */;
INSERT INTO `Admin` VALUES
(1,13,'2026-01-31 17:30:00'),
(2,14,'2026-02-14 17:30:00');
/*!40000 ALTER TABLE `Admin` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
-- Dumping data for table `AdminConsultant`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `AdminConsultant` WRITE;
/*!40000 ALTER TABLE `AdminConsultant` DISABLE KEYS */;
INSERT INTO `AdminConsultant` VALUES
(1,1,'2026-02-28 17:30:00'),
(1,2,'2026-03-04 17:30:00'),
(1,3,'2026-03-07 17:30:00'),
(2,4,'2026-03-11 17:30:00'),
(2,5,'2026-03-14 17:30:00');
/*!40000 ALTER TABLE `AdminConsultant` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Appointment`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Appointment` WRITE;
/*!40000 ALTER TABLE `Appointment` DISABLE KEYS */;
INSERT INTO `Appointment` VALUES
(1,1,2,'2026-07-16','10:00:00','confirmed',NULL,1,'2026-07-09 17:30:00','2026-09-20 07:53:34'),
(2,2,1,'2026-07-16','11:30:00','confirmed',NULL,4,'2026-07-10 17:30:00','2026-09-20 07:53:34'),
(3,3,3,'2026-07-16','14:00:00','confirmed',NULL,7,'2026-07-12 17:30:00','2026-09-20 07:53:34'),
(4,5,4,'2026-07-16','15:30:00','pending',NULL,NULL,'2026-07-12 17:30:00','2026-09-20 07:53:34'),
(5,1,2,'2026-07-05','10:00:00','completed',NULL,2,'2026-06-30 17:30:00','2026-09-20 07:53:34'),
(6,2,1,'2026-06-28','11:00:00','completed',NULL,5,'2026-06-19 17:30:00','2026-09-20 07:53:34'),
(7,3,5,'2026-06-20','15:30:00','completed',NULL,6,'2026-06-11 17:30:00','2026-09-20 07:53:34'),
(8,6,3,'2026-07-20','09:00:00','confirmed',NULL,NULL,'2026-07-12 17:30:00','2026-09-20 07:53:34'),
(9,1,5,'2026-07-22','13:00:00','pending',NULL,NULL,'2026-07-11 17:30:00','2026-09-20 07:53:34'),
(10,5,2,'2026-06-10','10:00:00','cancelled',NULL,NULL,'2026-06-04 17:30:00','2026-09-20 07:53:34'),
(11,8,2,'2026-09-21','09:00:00','cancelled',NULL,NULL,'2026-09-20 13:07:41','2026-09-20 13:32:57'),
(12,6,2,'2026-09-26','12:00:00','completed',NULL,8,'2026-09-26 05:30:04','2026-09-26 05:40:37'),
(13,9,2,'2026-10-08','12:30:00','completed',NULL,9,'2026-10-08 06:14:25','2026-10-08 06:17:39');
/*!40000 ALTER TABLE `Appointment` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ChatMessage`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `ChatMessage` WRITE;
/*!40000 ALTER TABLE `ChatMessage` DISABLE KEYS */;
INSERT INTO `ChatMessage` VALUES
(1,1,6,1,'patient','hi','2026-09-26 12:33:41'),
(2,1,6,1,'bot','Hi there. It’s good to see you. I’m Aura, and I’m here to listen. What’s on your mind today?','2026-09-26 12:33:43'),
(3,1,6,1,'patient','I am feeling severer depression and anxiety what should I do','2026-09-26 12:34:12'),
(4,1,6,1,'bot','I\'m really sorry you\'re carrying so much right now. That sounds incredibly heavy.\n\nTo support you best, are you feeling safe at this moment, or are you having any thoughts of harming yourself?','2026-09-26 12:34:19'),
(5,1,6,1,'patient','yes I am thinking about suicide?','2026-09-26 12:34:58'),
(6,1,6,1,'bot','I’m really concerned about you, and I’m glad you told me. You don’t have to go through this alone.\n\nPlease take this step now: call **192** (ambulance) or **199** (police), or go to the nearest hospital emergency department. If you’re not in immediate danger, please still reach out to someone you trust.\n\nCan you contact someone you trust right now to stay with you?','2026-09-26 12:35:05'),
(7,1,6,1,'patient','who should I consult with on healing horizon','2026-09-26 12:35:44'),
(8,1,6,1,'bot','On Healing Horizon, please book a session with a licensed counselor or therapist. Look for someone who lists support for depression, anxiety, or crisis care. They can give you professional guidance and help you create a safety plan.\n\nYou deserve real human support right now—not just this chat.\n\nWould you like me to help you find the booking page or a counselor who is available soon?','2026-09-26 12:35:51'),
(9,2,9,1,'patient','hello','2026-10-08 13:00:20'),
(10,2,9,1,'bot','Hello. I’m Aura, and I’m here to listen. How are you feeling today?','2026-10-08 13:00:23'),
(11,2,9,1,'patient','I am feeling depressed. what should I do?','2026-10-08 13:00:47'),
(12,2,9,1,'bot','I’m sorry you’re carrying that heavy feeling. It can be really draining, and you don’t have to figure it out alone. Before I suggest anything, can you tell me a little more about what “depressed” feels like for you today?','2026-10-08 13:00:52'),
(13,2,9,1,'patient','Students don\'t obey nor follow my instructions','2026-10-08 13:01:59'),
(14,2,9,1,'bot','That sounds exhausting and frustrating, especially when you’re already feeling low. Feeling unheard or disrespected in class can really wear you down over time. How has this been affecting your mood or energy lately?','2026-10-08 13:02:04'),
(15,2,9,1,'patient','I am about to do suicide','2026-10-08 13:02:49'),
(16,2,9,1,'bot','I’m really concerned about you, and I’m glad you told me. You don’t have to face this alone. Please stay on the line with me. In Myanmar, you can call emergency services now: 199 (police) or 192 (ambulance). If you can, please go to the nearest hospital or tell someone you trust right now. Your life matters, and this pain can ease with support. I’m here with you. Will you stay and talk with me for a moment?','2026-10-08 13:03:04');
/*!40000 ALTER TABLE `ChatMessage` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
-- Dumping data for table `ChatSummary`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `ChatSummary` WRITE;
/*!40000 ALTER TABLE `ChatSummary` DISABLE KEYS */;
/*!40000 ALTER TABLE `ChatSummary` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Comment`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Comment` WRITE;
/*!40000 ALTER TABLE `Comment` DISABLE KEYS */;
INSERT INTO `Comment` VALUES
(1,1,3,'This is so helpful, thank you for sharing! The 25-minute blocks work wonders for me too.','2026-07-10 10:30:00'),
(2,1,5,'Needed to read this today. Starting this method tomorrow.','2026-07-10 14:15:00'),
(3,2,3,'Boundaries are everything. Proud of you for taking that step.','2026-07-08 20:00:00'),
(4,8,6,'Hello','2026-09-26 14:58:24'),
(5,1,6,'test','2026-10-08 12:57:59');
/*!40000 ALTER TABLE `Comment` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommunityPost`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `CommunityPost` WRITE;
/*!40000 ALTER TABLE `CommunityPost` DISABLE KEYS */;
INSERT INTO `CommunityPost` VALUES
(1,1,'How I learned to manage exam anxiety without burning out','After three years of dreading finals week, I finally found a routine that works. I started breaking study sessions into 25-minute blocks, taking real breaks, and being kinder to myself when things did not go perfectly. It completely shifted my mindset from panic to preparation. Happy to share more if anyone wants details.',0,0,143,1228,5,3,'2026-07-10 02:30:00','2026-10-08 06:37:34'),
(2,5,'The power of saying no — setting boundaries with friends and family','Boundaries felt selfish until I realised they are the foundation of healthy relationships. Learning to say no without guilt has been one of the hardest but most rewarding parts of my journey this year.',0,0,97,867,3,1,'2026-07-08 12:00:00','2026-09-21 05:02:24'),
(3,6,'Small wins matter — celebrating progress, not perfection','I used to only notice what I had not done. Now I keep a small list of things that went well each day, even tiny ones. It has genuinely helped my mood over the last month.',1,0,64,504,1,0,'2026-07-05 07:30:00','2026-09-26 06:19:59'),
(8,6,'Testing','Testing',0,0,1,4,0,1,'2026-09-26 08:24:39','2026-09-26 08:28:24'),
(17,20,'test','test case',1,0,0,0,0,0,'2026-10-08 06:20:39','2026-10-08 06:20:39');
/*!40000 ALTER TABLE `CommunityPost` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Consultant`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Consultant` WRITE;
/*!40000 ALTER TABLE `Consultant` DISABLE KEYS */;
INSERT INTO `Consultant` VALUES
(1,8,'Licensed clinical psychologist with over 10 years of experience supporting university students with anxiety and stress management. Certified in CBT and mindfulness-based stress reduction.',4.85,1,'2026-02-28 17:30:00','2026-09-20 07:53:34'),
(2,9,'Experienced psychiatrist specialising in depression and mood disorders. Trained in psychodynamic therapy and medication management. Compassionate, evidence-based approach.',4.90,1,'2026-03-04 17:30:00','2026-09-20 07:53:34'),
(3,10,'Registered counsellor with a focus on stress, burnout, and academic pressure. Integrates solution-focused brief therapy with relaxation techniques.',4.90,1,'2026-03-07 17:30:00','2026-09-20 07:53:34'),
(4,11,'Behavioural therapist specialising in overthinking and rumination patterns. Uses a practical, structured approach to help patients break negative thought cycles.',4.70,0,'2026-03-11 17:30:00','2026-09-20 07:53:34'),
(5,12,'Trauma-informed psychologist with deep expertise in anxiety disorders and resilience coaching. Warm, patient-led approach grounded in the latest clinical research.',5.00,1,'2026-03-14 17:30:00','2026-09-20 07:53:34');
/*!40000 ALTER TABLE `Consultant` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ConsultantAvailability`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `ConsultantAvailability` WRITE;
/*!40000 ALTER TABLE `ConsultantAvailability` DISABLE KEYS */;
INSERT INTO `ConsultantAvailability` VALUES
(1,2,1,1,'09:00:00','13:00:00','2026-09-20 13:02:12','2026-10-18 08:52:05'),
(2,2,2,1,'09:00:00','13:00:00','2026-09-20 13:02:12','2026-10-18 08:52:05'),
(3,2,3,1,'09:00:00','13:00:00','2026-09-20 13:02:12','2026-10-18 08:52:05'),
(4,2,4,1,'09:00:00','13:00:00','2026-09-20 13:02:12','2026-10-18 08:52:05'),
(5,2,5,1,'09:00:00','13:00:00','2026-09-20 13:02:12','2026-10-18 08:52:05'),
(6,2,6,1,'09:00:00','13:00:00','2026-09-20 13:02:12','2026-10-18 08:52:05'),
(7,2,0,1,'09:00:00','13:00:00','2026-09-20 13:02:12','2026-10-18 08:52:05');
/*!40000 ALTER TABLE `ConsultantAvailability` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ConsultantAvailabilityOverride`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `ConsultantAvailabilityOverride` WRITE;
/*!40000 ALTER TABLE `ConsultantAvailabilityOverride` DISABLE KEYS */;
INSERT INTO `ConsultantAvailabilityOverride` VALUES
(1,2,'2026-09-27',1,'09:00:00','13:00:00','2026-09-21 04:35:55','2026-10-18 08:52:05');
/*!40000 ALTER TABLE `ConsultantAvailabilityOverride` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Conversation`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Conversation` WRITE;
/*!40000 ALTER TABLE `Conversation` DISABLE KEYS */;
INSERT INTO `Conversation` VALUES
(1,6,'hi','2026-09-26 12:33:41','2026-09-26 12:35:51'),
(2,9,'hello','2026-10-08 13:00:20','2026-10-08 13:03:04');
/*!40000 ALTER TABLE `Conversation` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Donation`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Donation` WRITE;
/*!40000 ALTER TABLE `Donation` DISABLE KEYS */;
INSERT INTO `Donation` VALUES
(1,1,25.00,0,'Sarah Johnson','sarah.johnson@university.edu','completed','2026-07-01 12:00:00'),
(2,NULL,50.00,1,NULL,NULL,'completed','2026-07-08 09:00:00'),
(3,NULL,25.00,1,NULL,NULL,'completed','2026-10-08 13:13:52');
/*!40000 ALTER TABLE `Donation` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Feedback`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Feedback` WRITE;
/*!40000 ALTER TABLE `Feedback` DISABLE KEYS */;
INSERT INTO `Feedback` VALUES
(1,5,1,2,5,'Dr. Chen was incredibly patient and understanding. I felt truly heard for the first time in a long while. Highly recommend.','2026-07-05 04:30:00'),
(2,6,2,1,4,'Great session — the breathing techniques Dr. Okafor taught me are still helping weeks later.','2026-06-28 05:30:00'),
(3,7,3,5,5,'Outstanding support. Dr. Nwosu has a genuinely warm approach that made opening up feel safe.','2026-06-20 10:00:00'),
(4,12,6,2,5,'','2026-09-26 09:58:50');
/*!40000 ALTER TABLE `Feedback` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Hospital`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Hospital` WRITE;
/*!40000 ALTER TABLE `Hospital` DISABLE KEYS */;
INSERT INTO `Hospital` VALUES
(1,1,'University Health Centre','Campus','1 College Road','2026-02-28 17:30:00'),
(2,1,'City General Hospital','Downtown','55 Main Street','2026-03-09 17:30:00'),
(3,2,'Oakwood Wellness Institute','Oakwood','8 Forest Way','2026-03-19 17:30:00'),
(4,1,'Pan Hlaing','Mandalay','68th Streed','2026-09-27 06:15:59'),
(5,1,'City Hospital','Mandalay','125 Klee Lane','2026-10-08 06:25:17');
/*!40000 ALTER TABLE `Hospital` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Notification` WRITE;
/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
INSERT INTO `Notification` VALUES
(1,1,'Your appointment with Dr. Michael Chen is confirmed for 16 July at 10:00 AM.',0,'2026-07-10 10:00:00'),
(2,1,'Dr. Sarah Okafor replied to your session notes.',1,'2026-07-09 14:00:00'),
(3,1,'Your weekly wellbeing check-in is ready to complete.',0,'2026-07-08 08:00:00'),
(4,2,'Your appointment with Dr. Sarah Okafor is confirmed for 16 July at 11:30 AM.',0,'2026-07-11 09:00:00'),
(5,13,'A new patient registration requires review.',0,'2026-07-12 15:00:00'),
(6,13,'Consultant Dr. James Whitfield is awaiting verification.',0,'2026-07-11 10:00:00'),
(7,9,'Hein Htet Aung booked an appointment with you for Sep 21 at 9:00 AM.',0,'2026-09-20 19:37:41'),
(8,15,'Dr. Michael Chen confirmed your appointment for Sep 21 at 9:00 AM.',0,'2026-09-20 19:45:26'),
(9,15,'Dr. Michael Chen confirmed your appointment for Sep 21 at 9:00 AM.',0,'2026-09-20 19:47:02'),
(10,9,'Hein Htet Aung cancelled their appointment with you for Sep 21 at 9:00 AM.',0,'2026-09-20 20:01:43'),
(11,9,'Hein Htet Aung cancelled their appointment with you for Sep 21 at 9:00 AM.',0,'2026-09-20 20:02:57'),
(12,13,'A post was reported: Other. Review it in the moderation queue.',0,'2026-09-21 11:04:01'),
(13,14,'A post was reported: Other. Review it in the moderation queue.',0,'2026-09-21 11:04:01'),
(14,9,'Chloe Zheng booked an appointment with you for Sep 26 at 12:00 PM.',0,'2026-09-26 12:00:04'),
(15,6,'Dr. Michael Chen confirmed your appointment for Sep 26 at 12:00 PM.',0,'2026-09-26 12:00:18'),
(16,9,'You received new feedback from a patient.',0,'2026-09-26 16:28:50'),
(17,13,'New consultant feedback submitted for Dr. Michael Chen.',0,'2026-09-26 16:28:50'),
(18,14,'New consultant feedback submitted for Dr. Michael Chen.',0,'2026-09-26 16:28:50'),
(19,9,'Thomas WIlliam booked an appointment with you for Oct 8 at 12:30 PM.',0,'2026-10-08 12:44:25'),
(20,20,'Dr. Michael Chen confirmed your appointment for Oct 8 at 12:30 PM.',0,'2026-10-08 12:44:59'),
(21,13,'A post was reported: Harmful content. Review it in the moderation queue.',0,'2026-10-08 12:58:18'),
(22,14,'A post was reported: Harmful content. Review it in the moderation queue.',0,'2026-10-08 12:58:18');
/*!40000 ALTER TABLE `Notification` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Patient`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Patient` WRITE;
/*!40000 ALTER TABLE `Patient` DISABLE KEYS */;
INSERT INTO `Patient` VALUES
(1,1,'Anxiety',1,'2026-04-11 17:30:00','2026-09-20 07:53:34'),
(2,2,'Depression',1,'2026-04-17 17:30:00','2026-09-20 07:53:34'),
(3,3,'Stress',1,'2026-05-02 17:30:00','2026-09-20 07:53:34'),
(4,4,'Overthinking',0,'2026-05-14 17:30:00','2026-09-20 07:53:34'),
(5,5,'Anxiety',1,'2026-05-21 17:30:00','2026-09-20 07:53:34'),
(6,6,'General Support',1,'2026-05-29 17:30:00','2026-09-20 07:53:34'),
(7,7,'Depression',1,'2026-06-01 17:30:00','2026-09-20 07:53:34'),
(8,15,'General Support',1,'2026-09-20 08:27:26','2026-09-20 08:27:26'),
(9,20,'Anxiety',1,'2026-10-08 06:13:22','2026-10-08 06:13:22');
/*!40000 ALTER TABLE `Patient` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PatientProgressLog`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `PatientProgressLog` WRITE;
/*!40000 ALTER TABLE `PatientProgressLog` DISABLE KEYS */;
INSERT INTO `PatientProgressLog` VALUES
(1,1,2,48.00,32.00,62.00,55.00,'Patient reports improvement in sleep patterns. Recommended continuing mindfulness exercises.','2026-07-08 11:00:00'),
(2,1,2,55.00,38.00,68.00,52.00,'Discussed exam-related stress. Introduced grounding techniques.','2026-06-24 11:00:00'),
(3,1,2,62.00,44.00,74.00,48.00,'Initial assessment completed. Patient expressed feeling overwhelmed.','2026-06-10 11:00:00'),
(4,2,1,30.00,42.00,35.00,58.00,'Depression score slightly higher than last session. Focused on behavioural activation.','2026-07-06 12:00:00'),
(5,6,2,50.00,100.00,80.00,75.00,'Follow up required.','2026-09-26 15:12:14'),
(6,9,2,100.00,50.00,20.00,80.00,'','2026-10-08 12:48:36');
/*!40000 ALTER TABLE `PatientProgressLog` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PostReport`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `PostReport` WRITE;
/*!40000 ALTER TABLE `PostReport` DISABLE KEYS */;
INSERT INTO `PostReport` VALUES
(1,1,15,'other','resolved','2026-09-21 04:34:01'),
(17,1,6,'harmful','resolved','2026-10-08 06:28:18');
/*!40000 ALTER TABLE `PostReport` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PostUpvote`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `PostUpvote` WRITE;
/*!40000 ALTER TABLE `PostUpvote` DISABLE KEYS */;
INSERT INTO `PostUpvote` VALUES
(4,6,8,'2026-09-26 08:27:59'),
(9,6,1,'2026-10-08 06:27:51');
/*!40000 ALTER TABLE `PostUpvote` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Psychiatrists`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Psychiatrists` WRITE;
/*!40000 ALTER TABLE `Psychiatrists` DISABLE KEYS */;
INSERT INTO `Psychiatrists` VALUES
(1,1,'Dr. Elena Rossi','2026-03-01 17:30:00'),
(2,1,'Dr. David Park','2026-03-01 17:30:00'),
(3,2,'Dr. Kevin Lau','2026-03-10 17:30:00'),
(4,2,'Dr. Maria Santos','2026-03-11 17:30:00'),
(5,2,'Dr. Thomas Wright','2026-03-11 17:30:00'),
(6,3,'Dr. Grace Henderson','2026-03-20 17:30:00'),
(7,3,'Dr. Omar Hassan','2026-03-21 17:30:00'),
(8,2,'Dr Kyaw Kyaw','2026-09-27 06:30:02'),
(9,5,'Dr Aung Aung','2026-10-08 06:25:35');
/*!40000 ALTER TABLE `Psychiatrists` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Referral`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Referral` WRITE;
/*!40000 ALTER TABLE `Referral` DISABLE KEYS */;
INSERT INTO `Referral` VALUES
(1,2,1,'Anxiety specialisation needed beyond current scope. Patient has shown good progress with CBT but would benefit from a trauma-informed approach.',5,NULL,'accepted','2026-07-01 17:30:00'),
(2,1,2,'Patient requested a referral to a psychiatrist for medication evaluation alongside therapy.',NULL,4,'pending','2026-07-09 17:30:00'),
(3,2,9,'dewpression',NULL,8,'pending','2026-10-08 06:22:04');
/*!40000 ALTER TABLE `Referral` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SessionSummary`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `SessionSummary` WRITE;
/*!40000 ALTER TABLE `SessionSummary` DISABLE KEYS */;
INSERT INTO `SessionSummary` VALUES
(1,5,2,'{\"focus\":\"Explored situational triggers surrounding acute work-related anxiety and cognitive overthinking loops. Discussed somatic grounding techniques and sleep routine regulation.\",\"takeaways\":\"Practiced 4-7-8 diaphragmatic breathing.\nEstablished a 15-minute evening digital wind-down routine.\nAgreed on journaling thought reframing prompts when anxiety exceeds 50%.\",\"nextSteps\":\"Continue daily 5-minute mindfulness breathing and bring thought journal entries to our next follow-up session in two weeks.\"}','2026-07-05 05:00:00','2026-07-05 05:00:00'),
(2,6,1,'{\"focus\":\"Focused on behavioural activation strategies for low mood and identifying small daily wins. Reviewed sleep hygiene and morning routine.\",\"takeaways\":\"Scheduled one pleasant activity per day.\nIntroduced a 10-minute morning walk before screen time.\",\"nextSteps\":\"Track daily mood and activity in the journal; review progress at the next session.\"}','2026-06-28 06:00:00','2026-06-28 06:00:00'),
(3,12,2,'{\"focus\":\"Discussed recent stress, low mood, and difficulties managing daily responsibilities. Explored common triggers and current emotional responses.\",\"takeaways\":\"Practice deep breathing, maintain a simple daily routine, and take short breaks when feeling overwhelmed. Identify and challenge negative thoughts.\",\"nextSteps\":\"Continue practicing the coping strategies and monitor mood changes. Follow up in the next session to review progress and discuss any ongoing concerns.\"}','2026-09-26 09:55:40','2026-09-26 09:55:40'),
(4,13,2,'{\"focus\":\"hello\",\"takeaways\":\"ello\",\"nextSteps\":\"next week\"}','2026-10-08 06:19:41','2026-10-08 06:19:41');
/*!40000 ALTER TABLE `SessionSummary` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Survey`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Survey` WRITE;
/*!40000 ALTER TABLE `Survey` DISABLE KEYS */;
INSERT INTO `Survey` VALUES
(1,'Weekly Wellbeing Check-in',1,'2026-05-31 17:30:00'),
(11,'Website Feedback',1,'2026-10-06 15:03:20'),
(12,'Website Feedback',1,'2026-10-08 06:26:52');
/*!40000 ALTER TABLE `Survey` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SurveyQuestions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `SurveyQuestions` WRITE;
/*!40000 ALTER TABLE `SurveyQuestions` DISABLE KEYS */;
INSERT INTO `SurveyQuestions` VALUES
(1,1,'How would you rate your overall wellbeing this week?','scale','[\"1\",\"2\",\"3\",\"4\",\"5\"]'),
(2,1,'Have you felt supported by the Healing Horizon platform?','multiple_choice','[\"Yes\",\"No\"]'),
(3,1,'What helped you most this week?','text',NULL),
(31,11,'What is the main reason you visited our mental health website today?','text',NULL),
(32,11,'How easy was it to find what you were looking for on our website?','text',NULL),
(33,11,'How safe, clear, and supportive does the information on this website feel to you?','text',NULL),
(34,12,'Test 1','text',NULL),
(35,12,'Test 2','text',NULL);
/*!40000 ALTER TABLE `SurveyQuestions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SurveyResponse`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `SurveyResponse` WRITE;
/*!40000 ALTER TABLE `SurveyResponse` DISABLE KEYS */;
INSERT INTO `SurveyResponse` VALUES
(1,1,1,'4','2026-06-10 09:00:00'),
(2,2,1,'Yes','2026-06-10 09:00:00'),
(3,3,1,'Talking to my consultant','2026-06-10 09:00:00'),
(4,1,2,'3','2026-06-11 10:00:00'),
(5,2,2,'Yes','2026-06-11 10:00:00'),
(6,3,2,'The community forum posts','2026-06-11 10:00:00'),
(7,1,3,'5','2026-06-12 11:00:00'),
(8,2,3,'Yes','2026-06-12 11:00:00'),
(9,3,3,'My video sessions with Dr. Kapoor','2026-06-12 11:00:00');
/*!40000 ALTER TABLE `SurveyResponse` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES
(1,'Sarah Johnson','sarah.johnson@university.edu','$2y$12$t7yrFibD9s37wqSfxLzw1eL6rGU.FcpXeajPBBR5Ex1uPc0FxyQ0O','patient','Female','2003-04-18','42 Campus Drive, Riverside Hall',NULL,0,NULL,'2026-04-11 17:30:00','2026-09-20 07:53:34'),
(2,'James Okonkwo','j.okonkwo@university.edu','$2y$12$hukSwYJhZp34l2BGdJKxYus52EIBxorg5Z7tG0D9/fWIzbhN7Prpu','patient','Male','2002-09-03','15 Oak Lane, Campus Residences',NULL,0,NULL,'2026-04-17 17:30:00','2026-09-20 07:53:34'),
(3,'Emily Tran','e.tran@university.edu','$2y$12$XWSv0csBgDmTUbQRwaYzKuLu/4IoSAOpblaGEIBJTaE5AqrTXJjqS','patient','Female','2004-01-22','7 Elm Court, Riverside Hall',NULL,0,NULL,'2026-05-02 17:30:00','2026-09-20 07:53:34'),
(4,'Liam O\'Brien','l.obrien@university.edu','$2y$12$.ooDavZzN2xfWaWfYLIaT.T8mL0I2bnDZ4D.KkmwTZv3GA/A/pqSG','patient','Male','2003-06-10','88 High Street, Downtown',NULL,1,'Violated community guidelines','2026-05-14 17:30:00','2026-09-20 07:53:34'),
(5,'Noor Hassan','n.hassan@university.edu','$2y$12$opLz2MI5OSDSAdyFIEI/7.d3mN0PUrE.nYacsWvUCXtAXxlo8Nedi','patient','Female','2002-11-30','12 Park View, Oakwood',NULL,0,NULL,'2026-05-21 17:30:00','2026-09-20 07:53:34'),
(6,'Chloe Zheng','c.zheng@university.edu','$2y$12$5qQ21Xt42K3pKxuUPETTOONayRCSlGnY9ZTCN4YzTaEvRP66xqfya','patient','Female','2004-03-14','3 Maple Close, Campus Residences',NULL,0,NULL,'2026-05-29 17:30:00','2026-09-20 07:53:34'),
(7,'Daniel Park','d.park@university.edu','$2y$12$Znf4.4HMvBKU7QUEgpre.euLI7NYNgsnive3QXbxu/ei93NVhmExq','patient','Male','2003-08-05','50 River Road, Downtown',NULL,1,'Fraudulent activity','2026-06-01 17:30:00','2026-09-20 07:53:34'),
(8,'Dr. Sarah Okafor','s.okafor@healinghorizon.org','$2y$12$G4fBixIa2hDyf3kmBTOBJudhiwE.aHP4wrPPZT5IEuHY2r2xT.keG','consultant','Female','1984-03-21','20 College Road, Campus',NULL,0,NULL,'2026-02-28 17:30:00','2026-09-20 07:53:34'),
(9,'Dr. Michael Chen','dr.michael.chen@healinghorizon.org','$2y$12$cT3Hpq7jpFhuLQrU9umr0.rGRd09Pdo6end/.e6k9ClJ8dxXahLTa','consultant','Male','1981-07-15','5 River Lane, Riverside','/api/uploads/avatars/avatar_9_1789965497_7125cf4b.jpg',0,NULL,'2026-03-04 17:30:00','2026-09-21 04:38:17'),
(10,'Dr. Priya Kapoor','p.kapoor@healinghorizon.org','$2y$12$yQ.kOuNDrFrOAedkRsyVYuVbLXkSbNStNForYF2TgElq3aYEoQleq','consultant','Female','1987-11-02','90 Main Street, Downtown',NULL,0,NULL,'2026-03-07 17:30:00','2026-09-20 07:53:34'),
(11,'Dr. James Whitfield','j.whitfield@healinghorizon.org','$2y$12$4.FHUxiFjUANhxqjUNm/0.lcqJ/5wz7QYFj7ntf6kKdDm4E09WuS.','consultant','Male','1979-05-18','44 Forest Way, Oakwood',NULL,0,NULL,'2026-03-11 17:30:00','2026-09-20 07:53:34'),
(12,'Dr. Amara Nwosu','a.nwosu@healinghorizon.org','$2y$12$1NRF9.jbpzCfWjRgFGBUMO7Y3fgHfhHpb6eunVGyBlu.B7FDDpB6q','consultant','Female','1983-09-27','12 Hilltop Rise, Campus',NULL,0,NULL,'2026-03-14 17:30:00','2026-09-20 07:53:34'),
(13,'Admin One','admin@healinghorizon.org','$2y$12$65suO6Nq094PR8CDmEL.Z./60eI.zRwmM.aGXM/TX9cQaCSsZ1p/y','admin','Male','1990-01-01',NULL,NULL,0,NULL,'2026-01-31 17:30:00','2026-09-20 07:53:34'),
(14,'Admin Two','admin2@healinghorizon.org','$2y$12$ojPtM.4WxPhsxM1tw47aZOZ9kRXAfPUFymUsnvIILLpiq6Qet9WzC','admin','Female','1992-06-15',NULL,NULL,0,NULL,'2026-02-14 17:30:00','2026-09-20 07:53:34'),
(15,'Hein Htet Aung','heinhtetaung@example.com','$2y$12$E6/mqXLzwC3GhXyjWhZbieOwj/JANuH11u2t43sXr55ExEnMM7KiO','patient','Male','2000-03-15','68th street, bet 108 and 109','/api/uploads/avatars/avatar_15_1789965217_5c199063.jpg',1,'Testing','2026-09-20 08:27:26','2026-09-27 05:28:07'),
(20,'Thomas WIlliam','thomaswill2002503@example.com','$2y$12$GpfKRlk4XjgQjsYCoeI4l.8YlQ36l9/lJ5uzEOt40vaDOg5T1QXi2','patient','Male','2000-03-15','68th street, bet 108 and 109',NULL,0,NULL,'2026-10-08 06:13:22','2026-10-08 06:29:46');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VideoConference`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `VideoConference` WRITE;
/*!40000 ALTER TABLE `VideoConference` DISABLE KEYS */;
INSERT INTO `VideoConference` VALUES
(1,'session-101','scheduled',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-09 17:30:00'),
(2,'session-102','ended',NULL,NULL,NULL,NULL,'2026-07-05 10:00:00','2026-07-05 10:50:00','2026-07-04 17:30:00'),
(3,'session-103','ongoing',NULL,NULL,NULL,NULL,'2026-07-12 14:00:00',NULL,'2026-07-11 17:30:00'),
(4,'session-104','scheduled',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-10 17:30:00'),
(5,'session-105','ended',NULL,NULL,NULL,NULL,'2026-06-28 11:00:00','2026-06-28 11:45:00','2026-06-27 17:30:00'),
(6,'session-106','ended',NULL,NULL,NULL,NULL,'2026-06-20 15:30:00','2026-06-20 16:15:00','2026-06-19 17:30:00'),
(7,'session-107','scheduled',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-12 17:30:00'),
(8,'hh-12-3e5f4721326cff60','ended','2026-09-26 12:02:45','2026-09-26 12:05:45','2026-09-26 12:10:25','2026-09-26 12:10:37',NULL,'2026-09-26 12:10:37','2026-09-26 05:32:45'),
(9,'hh-13-315f61fc692e460d','ended','2026-10-08 12:45:43','2026-10-08 12:46:18','2026-10-08 12:47:32','2026-10-08 12:47:39',NULL,'2026-10-08 12:47:39','2026-10-08 06:15:43');
/*!40000 ALTER TABLE `VideoConference` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-10-19 15:44:23
