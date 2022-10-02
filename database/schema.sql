DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(50) NOT NULL,
    mobile varchar(50),
    email varchar(50),
    verified boolean,
    last_seen_at_utc DATETIME,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_uuid (uuid)
);

DROP TABLE IF EXISTS images;
CREATE TABLE images (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(50) NOT NULL,
    media_storage_link TEXT NOT NULL,
    media_storage_key TEXT NOT NULL,
    user_uuid varchar(50) NOT NULL,
    position_index INT NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_uuid (uuid)
);

DROP TABLE IF EXISTS videos;
CREATE TABLE videos (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(50) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    video_id varchar(50),
    channel_id varchar(50),
    video_title TEXT,
    video_description TEXT,
    category_id varchar(50),
    topic_categories TEXT,
    UNIQUE KEY unique_uuid (uuid)
);

DROP TABLE IF EXISTS tracked_videos;
CREATE TABLE tracked_videos (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(50) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    video_uuid varchar(50),
    user_uuid varchar(50),
    order_index INTEGER,
    UNIQUE KEY unique_uuid (uuid)
);

DROP TABLE IF EXISTS dating_match_preferences;
CREATE TABLE dating_match_preferences (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(50) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    user_uuid varchar(50),
    gender varchar(50),
    gender_preference varchar(50),
    age_min_preference INT,
    age_max_preference INT,
    zipcode varchar(50),
    zipcode_preference varchar(50),
    age INTEGER,
    UNIQUE KEY unique_uuid (uuid)

);

DROP TABLE IF EXISTS matches;
CREATE TABLE matches (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(50) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    initiator_uuid varchar(50),
    receiver_uuid varchar(50),
  
    UNIQUE KEY unique_uuid (uuid)
);

DROP TABLE IF EXISTS likes;
CREATE TABLE likes (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(50) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    initiator_uuid varchar(50),
    receiver_uuid varchar(50),
  
    UNIQUE KEY unique_uuid (uuid)
);

DROP TABLE IF EXISTS blocks;
CREATE TABLE blocks (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid varchar(50) NOT NULL,
    deleted_at_utc DATETIME,
    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

    initiator_uuid varchar(50),
    receiver_uuid varchar(50),
  
    UNIQUE KEY unique_uuid (uuid)
);