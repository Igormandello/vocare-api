CREATE TABLE [tag] (
  [id] int primary key identity,
  [name] varchar(30)
);

CREATE TABLE [notification] (
  [id] int primary key identity,
  [user_id] int NOT NULL,
  [message] varchar(100) NOT NULL,
  [data] datetime NOT NULL,
  [state] bit NOT NULL
);

CREATE TABLE [course] (
  [id] int primary key identity,
  [name] varchar(50) NOT NULL,
  [shortname] varchar(30) NOT NULL,
  [description] varchar(300) NOT NULL,
  [area_id] int NOT NULL
);

CREATE TABLE [post_view] (
  [post_id] int NOT NULL,
  [user_id] int NOT NULL
);

CREATE TABLE [post] (
  [id] int primary key identity,
  [user_id] int NOT NULL,
  [title] varchar(100) NOT NULL,
  [message] varchar(MAX) NOT NULL,
  [posted_on] datetime NOT NULL,
  [area_id] int NOT NULL
);

CREATE TABLE [comment] (
  [id] int primary key identity,
  [post_id] int NOT NULL,
  [user_id] int NOT NULL,
  [message] varchar(MAX) NOT NULL,
  [commented_on] datetime NOT NULL
);

CREATE TABLE [user] (
  [id] int primary key identity,
  [email] varchar(255) NULL,
  [password] varchar(64) NULL,
  [username] varchar(30) NOT NULL,
  [level] int NOT NULL,
  [profile_picture] varchar(max) NULL,
  [deleted] bit NOT NULL
);

CREATE TABLE [user_login] (
  [user_id] int NOT NULL,
  [access_token] varchar(MAX) NOT NULL,
  [provider_id] int NOT NULL
);

CREATE TABLE [provider] (
  [id] int primary key identity,
  [name] varchar(50) NOT NULL
);

CREATE TABLE [post_tag] (
  [post_id] int NOT NULL,
  [tag_id] int NOT NULL
);

CREATE TABLE [area] (
  [id] int primary key identity,
  [name] varchar(30) NOT NULL
);