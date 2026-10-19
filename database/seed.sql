-- ============================================
-- Healing Horizon — Seed / Sample Data
-- Requires schema.sql to be run first
-- All INSERTs use ON DUPLICATE KEY UPDATE — safe to re-run
-- ============================================

USE `healinghorizon`;

-- ============ USERS ============
-- Password for all seed users is: password123

INSERT INTO `Users` (`userId`, `name`, `email`, `password_hash`, `role`, `gender`, `dob`, `address`, `isBanned`, `createdAt`) VALUES
(1,  'Sarah Johnson',     'sarah.johnson@university.edu',   '$2y$12$t7yrFibD9s37wqSfxLzw1eL6rGU.FcpXeajPBBR5Ex1uPc0FxyQ0O', 'patient',    'Female', '2003-04-18', '42 Campus Drive, Riverside Hall',         0, '2026-04-12'),
(2,  'James Okonkwo',     'j.okonkwo@university.edu',       '$2y$12$hukSwYJhZp34l2BGdJKxYus52EIBxorg5Z7tG0D9/fWIzbhN7Prpu', 'patient',    'Male',   '2002-09-03', '15 Oak Lane, Campus Residences',          0, '2026-04-18'),
(3,  'Emily Tran',        'e.tran@university.edu',          '$2y$12$XWSv0csBgDmTUbQRwaYzKuLu/4IoSAOpblaGEIBJTaE5AqrTXJjqS', 'patient',    'Female', '2004-01-22', '7 Elm Court, Riverside Hall',             0, '2026-05-03'),
(4,  'Liam O''Brien',     'l.obrien@university.edu',        '$2y$12$.ooDavZzN2xfWaWfYLIaT.T8mL0I2bnDZ4D.KkmwTZv3GA/A/pqSG', 'patient',    'Male',   '2003-06-10', '88 High Street, Downtown',                1, '2026-05-15'),
(5,  'Noor Hassan',       'n.hassan@university.edu',        '$2y$12$opLz2MI5OSDSAdyFIEI/7.d3mN0PUrE.nYacsWvUCXtAXxlo8Nedi', 'patient',    'Female', '2002-11-30', '12 Park View, Oakwood',                   0, '2026-05-22'),
(6,  'Chloe Zheng',       'c.zheng@university.edu',         '$2y$12$5qQ21Xt42K3pKxuUPETTOONayRCSlGnY9ZTCN4YzTaEvRP66xqfya', 'patient',    'Female', '2004-03-14', '3 Maple Close, Campus Residences',        0, '2026-05-30'),
(7,  'Daniel Park',       'd.park@university.edu',          '$2y$12$Znf4.4HMvBKU7QUEgpre.euLI7NYNgsnive3QXbxu/ei93NVhmExq', 'patient',    'Male',   '2003-08-05', '50 River Road, Downtown',                 1, '2026-06-02'),

(8,  'Dr. Sarah Okafor',  's.okafor@healinghorizon.org',   '$2y$12$G4fBixIa2hDyf3kmBTOBJudhiwE.aHP4wrPPZT5IEuHY2r2xT.keG', 'consultant', 'Female', '1984-03-21', '20 College Road, Campus',                  0, '2026-03-01'),
(9,  'Dr. Michael Chen',  'dr.michael.chen@healinghorizon.org', '$2y$12$cT3Hpq7jpFhuLQrU9umr0.rGRd09Pdo6end/.e6k9ClJ8dxXahLTa', 'consultant', 'Male', '1981-07-15', '5 River Lane, Riverside',                 0, '2026-03-05'),
(10, 'Dr. Priya Kapoor',  'p.kapoor@healinghorizon.org',   '$2y$12$yQ.kOuNDrFrOAedkRsyVYuVbLXkSbNStNForYF2TgElq3aYEoQleq', 'consultant', 'Female', '1987-11-02', '90 Main Street, Downtown',                0, '2026-03-08'),
(11, 'Dr. James Whitfield','j.whitfield@healinghorizon.org','$2y$12$4.FHUxiFjUANhxqjUNm/0.lcqJ/5wz7QYFj7ntf6kKdDm4E09WuS.', 'consultant', 'Male',   '1979-05-18', '44 Forest Way, Oakwood',                  0, '2026-03-12'),
(12, 'Dr. Amara Nwosu',   'a.nwosu@healinghorizon.org',    '$2y$12$1NRF9.jbpzCfWjRgFGBUMO7Y3fgHfhHpb6eunVGyBlu.B7FDDpB6q', 'consultant', 'Female', '1983-09-27', '12 Hilltop Rise, Campus',                 0, '2026-03-15'),

(13, 'Admin One',         'admin@healinghorizon.org',       '$2y$12$65suO6Nq094PR8CDmEL.Z./60eI.zRwmM.aGXM/TX9cQaCSsZ1p/y', 'admin',      'Male',   '1990-01-01', NULL,                                      0, '2026-02-01'),
(14, 'Admin Two',         'admin2@healinghorizon.org',      '$2y$12$ojPtM.4WxPhsxM1tw47aZOZ9kRXAfPUFymUsnvIILLpiq6Qet9WzC', 'admin',      'Female', '1992-06-15', NULL,                                      0, '2026-02-15')
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`), `email` = VALUES(`email`),
    `password_hash` = VALUES(`password_hash`), `role` = VALUES(`role`),
    `gender` = VALUES(`gender`), `dob` = VALUES(`dob`),
    `address` = VALUES(`address`), `isBanned` = VALUES(`isBanned`),
    `createdAt` = VALUES(`createdAt`), `updatedAt` = NOW();

UPDATE `Users` SET `banReason` = 'Violated community guidelines' WHERE `userId` = 4;
UPDATE `Users` SET `banReason` = 'Fraudulent activity' WHERE `userId` = 7;

-- ============ PATIENTS ============

INSERT INTO `Patient` (`patientId`, `userId`, `supportPreference`, `emailNotification`, `createdAt`) VALUES
(1, 1,  'Anxiety',          1, '2026-04-12'),
(2, 2,  'Depression',       1, '2026-04-18'),
(3, 3,  'Stress',           1, '2026-05-03'),
(4, 4,  'Overthinking',     0, '2026-05-15'),
(5, 5,  'Anxiety',          1, '2026-05-22'),
(6, 6,  'General Support',  1, '2026-05-30'),
(7, 7,  'Depression',       1, '2026-06-02')
ON DUPLICATE KEY UPDATE
    `userId` = VALUES(`userId`), `supportPreference` = VALUES(`supportPreference`),
    `emailNotification` = VALUES(`emailNotification`), `createdAt` = VALUES(`createdAt`),
    `updatedAt` = NOW();

-- ============ CONSULTANTS ============

INSERT INTO `Consultant` (`consultantId`, `userId`, `biography`, `rating`, `isVerified`, `createdAt`) VALUES
(1, 8,  'Licensed clinical psychologist with over 10 years of experience supporting university students with anxiety and stress management. Certified in CBT and mindfulness-based stress reduction.', 4.90, 1, '2026-03-01'),
(2, 9,  'Experienced psychiatrist specialising in depression and mood disorders. Trained in psychodynamic therapy and medication management. Compassionate, evidence-based approach.', 4.80, 1, '2026-03-05'),
(3, 10, 'Registered counsellor with a focus on stress, burnout, and academic pressure. Integrates solution-focused brief therapy with relaxation techniques.', 4.90, 1, '2026-03-08'),
(4, 11, 'Behavioural therapist specialising in overthinking and rumination patterns. Uses a practical, structured approach to help patients break negative thought cycles.', 4.70, 0, '2026-03-12'),
(5, 12, 'Trauma-informed psychologist with deep expertise in anxiety disorders and resilience coaching. Warm, patient-led approach grounded in the latest clinical research.', 5.00, 1, '2026-03-15')
ON DUPLICATE KEY UPDATE
    `userId` = VALUES(`userId`), `biography` = VALUES(`biography`),
    `rating` = VALUES(`rating`), `isVerified` = VALUES(`isVerified`),
    `createdAt` = VALUES(`createdAt`), `updatedAt` = NOW();

-- ============ ADMINS ============

INSERT INTO `Admin` (`adminId`, `userId`, `createdAt`) VALUES
(1, 13, '2026-02-01'),
(2, 14, '2026-02-15')
ON DUPLICATE KEY UPDATE
    `userId` = VALUES(`userId`), `createdAt` = VALUES(`createdAt`);

INSERT INTO `AdminConsultant` (`adminId`, `consultantId`, `createdAt`) VALUES
(1, 1, '2026-03-01'),
(1, 2, '2026-03-05'),
(1, 3, '2026-03-08'),
(2, 4, '2026-03-12'),
(2, 5, '2026-03-15')
ON DUPLICATE KEY UPDATE
    `createdAt` = VALUES(`createdAt`);

-- ============ HOSPITALS ============

INSERT INTO `Hospital` (`hospitalId`, `adminId`, `hospitalName`, `city`, `address`, `createdAt`) VALUES
(1, 1, 'University Health Centre',    'Campus',    '1 College Road',     '2026-03-01'),
(2, 1, 'City General Hospital',       'Downtown',  '55 Main Street',     '2026-03-10'),
(3, 2, 'Oakwood Wellness Institute',  'Oakwood',   '8 Forest Way',       '2026-03-20')
ON DUPLICATE KEY UPDATE
    `adminId` = VALUES(`adminId`), `hospitalName` = VALUES(`hospitalName`),
    `city` = VALUES(`city`), `address` = VALUES(`address`),
    `createdAt` = VALUES(`createdAt`);

-- ============ PSYCHIATRISTS ============

INSERT INTO `Psychiatrists` (`psychiatristId`, `hospitalId`, `psychiatristName`, `createdAt`) VALUES
(1, 1, 'Dr. Elena Rossi',    '2026-03-02'),
(2, 1, 'Dr. David Park',     '2026-03-02'),
(3, 2, 'Dr. Kevin Lau',      '2026-03-11'),
(4, 2, 'Dr. Maria Santos',   '2026-03-12'),
(5, 2, 'Dr. Thomas Wright',  '2026-03-12'),
(6, 3, 'Dr. Grace Henderson','2026-03-21'),
(7, 3, 'Dr. Omar Hassan',    '2026-03-22')
ON DUPLICATE KEY UPDATE
    `hospitalId` = VALUES(`hospitalId`), `psychiatristName` = VALUES(`psychiatristName`),
    `createdAt` = VALUES(`createdAt`);

-- ============ AI CHATBOT ============

INSERT INTO `AIChatBot` (`botId`, `botName`) VALUES
(1, 'Horizon Companion')
ON DUPLICATE KEY UPDATE
    `botName` = VALUES(`botName`);

-- ============ VIDEO CONFERENCES ============

INSERT INTO `VideoConference` (`conferenceId`, `roomName`, `status`, `createdAt`) VALUES
(1, 'session-101',     'scheduled', '2026-07-10'),
(2, 'session-102',     'ended',     '2026-07-05'),
(3, 'session-103',     'ongoing',   '2026-07-12'),
(4, 'session-104',     'scheduled', '2026-07-11'),
(5, 'session-105',     'ended',     '2026-06-28'),
(6, 'session-106',     'ended',     '2026-06-20'),
(7, 'session-107',     'scheduled', '2026-07-13')
ON DUPLICATE KEY UPDATE
    `roomName` = VALUES(`roomName`), `status` = VALUES(`status`),
    `createdAt` = VALUES(`createdAt`);

UPDATE `VideoConference` SET `startedAt` = '2026-07-05 10:00:00', `endedAt` = '2026-07-05 10:50:00' WHERE `conferenceId` = 2;
UPDATE `VideoConference` SET `startedAt` = '2026-07-12 14:00:00' WHERE `conferenceId` = 3;
UPDATE `VideoConference` SET `startedAt` = '2026-06-28 11:00:00', `endedAt` = '2026-06-28 11:45:00' WHERE `conferenceId` = 5;
UPDATE `VideoConference` SET `startedAt` = '2026-06-20 15:30:00', `endedAt` = '2026-06-20 16:15:00' WHERE `conferenceId` = 6;

-- ============ APPOINTMENTS ============

INSERT INTO `Appointment` (`appointmentId`, `patientId`, `consultantId`, `appointmentDate`, `appointmentTime`, `status`, `conferenceId`, `createdAt`) VALUES
(1,  1, 2, '2026-07-16', '10:00:00', 'confirmed',  1, '2026-07-10'),
(2,  2, 1, '2026-07-16', '11:30:00', 'confirmed',  4, '2026-07-11'),
(3,  3, 3, '2026-07-16', '14:00:00', 'confirmed',  7, '2026-07-13'),
(4,  5, 4, '2026-07-16', '15:30:00', 'pending',    NULL, '2026-07-13'),
(5,  1, 2, '2026-07-05', '10:00:00', 'completed',  2, '2026-07-01'),
(6,  2, 1, '2026-06-28', '11:00:00', 'completed',  5, '2026-06-20'),
(7,  3, 5, '2026-06-20', '15:30:00', 'completed',  6, '2026-06-12'),
(8,  6, 3, '2026-07-20', '09:00:00', 'confirmed',  NULL, '2026-07-13'),
(9,  1, 5, '2026-07-22', '13:00:00', 'pending',    NULL, '2026-07-12'),
(10, 5, 2, '2026-06-10', '10:00:00', 'cancelled',  NULL, '2026-06-05')
ON DUPLICATE KEY UPDATE
    `patientId` = VALUES(`patientId`), `consultantId` = VALUES(`consultantId`),
    `appointmentDate` = VALUES(`appointmentDate`), `appointmentTime` = VALUES(`appointmentTime`),
    `status` = VALUES(`status`), `conferenceId` = VALUES(`conferenceId`),
    `createdAt` = VALUES(`createdAt`), `updatedAt` = NOW();

-- ============ FEEDBACK ============

INSERT INTO `Feedback` (`appointmentId`, `patientId`, `consultantId`, `rating`, `comment`, `createdAt`) VALUES
(5, 1, 2, 5, 'Dr. Chen was incredibly patient and understanding. I felt truly heard for the first time in a long while. Highly recommend.', '2026-07-05 11:00:00'),
(6, 2, 1, 4, 'Great session — the breathing techniques Dr. Okafor taught me are still helping weeks later.', '2026-06-28 12:00:00'),
(7, 3, 5, 5, 'Outstanding support. Dr. Nwosu has a genuinely warm approach that made opening up feel safe.', '2026-06-20 16:30:00')
ON DUPLICATE KEY UPDATE
    `patientId` = VALUES(`patientId`), `consultantId` = VALUES(`consultantId`),
    `rating` = VALUES(`rating`), `comment` = VALUES(`comment`),
    `createdAt` = VALUES(`createdAt`);

UPDATE `Consultant` SET `rating` = 4.90 WHERE `consultantId` = 2;
UPDATE `Consultant` SET `rating` = 4.85 WHERE `consultantId` = 1;

-- ============ SESSION SUMMARIES ============

-- `content` stores the clinical summary as a JSON object with the three
-- structured fields the client renders: {"focus", "takeaways", "nextSteps"}.
INSERT INTO `SessionSummary` (`summaryId`, `appointmentId`, `consultantId`, `content`, `createdAt`, `updatedAt`) VALUES
(1, 5, 2, '{"focus":"Explored situational triggers surrounding acute work-related anxiety and cognitive overthinking loops. Discussed somatic grounding techniques and sleep routine regulation.","takeaways":"Practiced 4-7-8 diaphragmatic breathing.\nEstablished a 15-minute evening digital wind-down routine.\nAgreed on journaling thought reframing prompts when anxiety exceeds 50%.","nextSteps":"Continue daily 5-minute mindfulness breathing and bring thought journal entries to our next follow-up session in two weeks."}', '2026-07-05 11:30:00', '2026-07-05 11:30:00'),
(2, 6, 1, '{"focus":"Focused on behavioural activation strategies for low mood and identifying small daily wins. Reviewed sleep hygiene and morning routine.","takeaways":"Scheduled one pleasant activity per day.\nIntroduced a 10-minute morning walk before screen time.","nextSteps":"Track daily mood and activity in the journal; review progress at the next session."}', '2026-06-28 12:30:00', '2026-06-28 12:30:00')
ON DUPLICATE KEY UPDATE
    `consultantId` = VALUES(`consultantId`), `content` = VALUES(`content`),
    `updatedAt` = VALUES(`updatedAt`);

-- ============ COMMUNITY POSTS ============

INSERT INTO `CommunityPost` (`postId`, `userId`, `postTitle`, `content`, `anonymousPost`, `upVoteCount`, `viewCount`, `shareCount`, `commentCount`, `createdAt`) VALUES
(1, 1, 'How I learned to manage exam anxiety without burning out',
    'After three years of dreading finals week, I finally found a routine that works. I started breaking study sessions into 25-minute blocks, taking real breaks, and being kinder to myself when things did not go perfectly. It completely shifted my mindset from panic to preparation. Happy to share more if anyone wants details.',
    0, 142, 1204, 5, 2, '2026-07-10 09:00:00'),
(2, 5, 'The power of saying no — setting boundaries with friends and family',
    'Boundaries felt selfish until I realised they are the foundation of healthy relationships. Learning to say no without guilt has been one of the hardest but most rewarding parts of my journey this year.',
    0, 97, 863, 3, 1, '2026-07-08 18:30:00'),
(3, 6, 'Small wins matter — celebrating progress, not perfection',
    'I used to only notice what I had not done. Now I keep a small list of things that went well each day, even tiny ones. It has genuinely helped my mood over the last month.',
    1, 64, 502, 1, 0, '2026-07-05 14:00:00')
ON DUPLICATE KEY UPDATE
    `userId` = VALUES(`userId`), `postTitle` = VALUES(`postTitle`),
    `content` = VALUES(`content`), `anonymousPost` = VALUES(`anonymousPost`),
    `upVoteCount` = VALUES(`upVoteCount`), `viewCount` = VALUES(`viewCount`),
    `shareCount` = VALUES(`shareCount`), `commentCount` = VALUES(`commentCount`),
    `createdAt` = VALUES(`createdAt`), `updatedAt` = NOW();

-- ============ COMMENTS ============

INSERT INTO `Comment` (`commentId`, `postId`, `commentBy`, `comment`, `createdAt`) VALUES
(1, 1, 3, 'This is so helpful, thank you for sharing! The 25-minute blocks work wonders for me too.', '2026-07-10 10:30:00'),
(2, 1, 5, 'Needed to read this today. Starting this method tomorrow.', '2026-07-10 14:15:00'),
(3, 2, 3, 'Boundaries are everything. Proud of you for taking that step.', '2026-07-08 20:00:00')
ON DUPLICATE KEY UPDATE
    `postId` = VALUES(`postId`), `commentBy` = VALUES(`commentBy`),
    `comment` = VALUES(`comment`), `createdAt` = VALUES(`createdAt`);

-- ============ DONATIONS ============

INSERT INTO `Donation` (`donationId`, `userId`, `amount`, `anonymousDonation`, `donarName`, `donarEmail`, `status`, `donatedAt`) VALUES
(1, 1,   25.00, 0, 'Sarah Johnson',    'sarah.johnson@university.edu',  'completed', '2026-07-01 12:00:00'),
(2, NULL, 50.00, 1, NULL,              NULL,                           'completed', '2026-07-08 09:00:00')
ON DUPLICATE KEY UPDATE
    `userId` = VALUES(`userId`), `amount` = VALUES(`amount`),
    `anonymousDonation` = VALUES(`anonymousDonation`),
    `donarName` = VALUES(`donarName`), `donarEmail` = VALUES(`donarEmail`),
    `status` = VALUES(`status`), `donatedAt` = VALUES(`donatedAt`);

-- ============ SURVEY ============

INSERT INTO `Survey` (`surveyId`, `title`, `createdByAdminId`, `createdAt`) VALUES
(1, 'Weekly Wellbeing Check-in', 1, '2026-06-01')
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`), `createdByAdminId` = VALUES(`createdByAdminId`),
    `createdAt` = VALUES(`createdAt`);

INSERT INTO `SurveyQuestions` (`questionId`, `surveyId`, `question`, `type`, `options`) VALUES
(1, 1, 'How would you rate your overall wellbeing this week?', 'scale', '["1","2","3","4","5"]'),
(2, 1, 'Have you felt supported by the Healing Horizon platform?', 'multiple_choice', '["Yes","No"]'),
(3, 1, 'What helped you most this week?', 'text', NULL)
ON DUPLICATE KEY UPDATE
    `surveyId` = VALUES(`surveyId`), `question` = VALUES(`question`),
    `type` = VALUES(`type`), `options` = VALUES(`options`);

INSERT INTO `SurveyResponse` (`responseId`, `questionId`, `patientId`, `answer`, `submittedAt`) VALUES
(1, 1, 1, '4', '2026-06-10 09:00:00'),
(2, 2, 1, 'Yes', '2026-06-10 09:00:00'),
(3, 3, 1, 'Talking to my consultant', '2026-06-10 09:00:00'),
(4, 1, 2, '3', '2026-06-11 10:00:00'),
(5, 2, 2, 'Yes', '2026-06-11 10:00:00'),
(6, 3, 2, 'The community forum posts', '2026-06-11 10:00:00'),
(7, 1, 3, '5', '2026-06-12 11:00:00'),
(8, 2, 3, 'Yes', '2026-06-12 11:00:00'),
(9, 3, 3, 'My video sessions with Dr. Kapoor', '2026-06-12 11:00:00')
ON DUPLICATE KEY UPDATE
    `questionId` = VALUES(`questionId`), `patientId` = VALUES(`patientId`),
    `answer` = VALUES(`answer`), `submittedAt` = VALUES(`submittedAt`);

-- ============ PROGRESS LOGS ============

INSERT INTO `PatientProgressLog` (`progressId`, `patientId`, `consultantId`, `anxietyScore`, `depressionScore`, `overthinkingScore`, `overallScore`, `note`, `loggedAt`) VALUES
(1, 1, 2, 48.00, 32.00, 62.00, 55.00, 'Patient reports improvement in sleep patterns. Recommended continuing mindfulness exercises.', '2026-07-08 11:00:00'),
(2, 1, 2, 55.00, 38.00, 68.00, 52.00, 'Discussed exam-related stress. Introduced grounding techniques.', '2026-06-24 11:00:00'),
(3, 1, 2, 62.00, 44.00, 74.00, 48.00, 'Initial assessment completed. Patient expressed feeling overwhelmed.', '2026-06-10 11:00:00'),
(4, 2, 1, 30.00, 42.00, 35.00, 58.00, 'Depression score slightly higher than last session. Focused on behavioural activation.', '2026-07-06 12:00:00')
ON DUPLICATE KEY UPDATE
    `patientId` = VALUES(`patientId`), `consultantId` = VALUES(`consultantId`),
    `anxietyScore` = VALUES(`anxietyScore`), `depressionScore` = VALUES(`depressionScore`),
    `overthinkingScore` = VALUES(`overthinkingScore`), `overallScore` = VALUES(`overallScore`),
    `note` = VALUES(`note`), `loggedAt` = VALUES(`loggedAt`);

-- ============ REFERRALS ============

INSERT INTO `Referral` (`referralId`, `consultantId`, `patientId`, `caseOfReferral`, `referToConsultantId`, `referToPsychiatristId`, `status`, `createdAt`) VALUES
(1, 2, 1, 'Anxiety specialisation needed beyond current scope. Patient has shown good progress with CBT but would benefit from a trauma-informed approach.', 5, NULL, 'accepted', '2026-07-02'),
(2, 1, 2, 'Patient requested a referral to a psychiatrist for medication evaluation alongside therapy.', NULL, 4, 'pending', '2026-07-10')
ON DUPLICATE KEY UPDATE
    `consultantId` = VALUES(`consultantId`), `patientId` = VALUES(`patientId`),
    `caseOfReferral` = VALUES(`caseOfReferral`),
    `referToConsultantId` = VALUES(`referToConsultantId`),
    `referToPsychiatristId` = VALUES(`referToPsychiatristId`),
    `status` = VALUES(`status`), `createdAt` = VALUES(`createdAt`);

-- ============ NOTIFICATIONS ============

INSERT INTO `Notification` (`notificationId`, `userId`, `message`, `isRead`, `createdAt`) VALUES
(1, 1,  'Your appointment with Dr. Michael Chen is confirmed for 16 July at 10:00 AM.', 0, '2026-07-10 10:00:00'),
(2, 1,  'Dr. Sarah Okafor replied to your session notes.', 1, '2026-07-09 14:00:00'),
(3, 1,  'Your weekly wellbeing check-in is ready to complete.', 0, '2026-07-08 08:00:00'),
(4, 2,  'Your appointment with Dr. Sarah Okafor is confirmed for 16 July at 11:30 AM.', 0, '2026-07-11 09:00:00'),
(5, 13, 'A new patient registration requires review.', 0, '2026-07-12 15:00:00'),
(6, 13, 'Consultant Dr. James Whitfield is awaiting verification.', 0, '2026-07-11 10:00:00')
ON DUPLICATE KEY UPDATE
    `userId` = VALUES(`userId`), `message` = VALUES(`message`),
    `isRead` = VALUES(`isRead`), `createdAt` = VALUES(`createdAt`);
