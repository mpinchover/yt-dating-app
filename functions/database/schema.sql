DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(20) NOT NULL,
    mobile varchar(20),
    email varchar(20),
    verified boolean,
    last_seen_at_utc DATETIME,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_uuid (uuid)
)

DROP TABLE IF EXISTS videos;
CREATE TABLE users (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(20) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    video_id varchar(20),
    channel_id varchar(20),
    video_title TEXT,
    video_description TEXT,
    category_id varchar(20),
    topic_categories TEXT,
    UNIQUE KEY unique_uuid (uuid)
)

DROP TABLE IF EXISTS tracked_videos;
CREATE TABLE tracked_videos (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(20) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    video_uuid varchar(20),
    user_uuid varchar(20),
    order INT,
    UNIQUE KEY unique_uuid (uuid)
)

DROP TABLE IF EXISTS dating_match_preferences;
CREATE TABLE dating_match_preferences (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(20) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    user_uuid varchar(20),
    gender_preference_man BOOLEAN,
    gender_preference_woman BOOLEAN,
    gender_man BOOLEAN,
    gender_woman BOOLEAN,
    age_min_preference INT,
    age_max_preference INT,
    zipcode varchar(20),
    zipcode_preference(20),
    age INT,
    UNIQUE KEY unique_uuid (uuid)
)

DROP TABLE IF EXISTS matches;
CREATE TABLE matches (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(20) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    initiator_uuid varchar(20),
    responder_uuid varchar(20),
  
    UNIQUE KEY unique_uuid (uuid)
)

DROP TABLE IF EXISTS likes;
CREATE TABLE likes (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(20) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    initiator_uuid varchar(20),
    receiver_uuid varchar(20),
  
    UNIQUE KEY unique_uuid (uuid)
)

DROP TABLE IF EXISTS blocks;
CREATE TABLE blocks (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(20) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    initiator_uuid varchar(20),
    receiver_uuid varchar(20),
  
    UNIQUE KEY unique_uuid (uuid)
)