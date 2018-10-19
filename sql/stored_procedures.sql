--Counts the total messages from an user
--Messages = Posts + Comments
CREATE PROCEDURE sp_count_messages
	@user_id int
AS
 SELECT SUM(post.[count] + comment.[count]) AS [count] FROM
 (SELECT COUNT(*) AS [count] FROM post WHERE user_id = @user_id) post,
 (SELECT COUNT(*) AS [count] FROM comment WHERE user_id = @user_id) comment
GO

 ---------------------------------------------------------------------------

--Returns the user who have that email and password
CREATE PROCEDURE sp_user_login
	@email varchar(255),
	@password varchar(64)
AS
 SELECT * FROM [user] WHERE email = @email and password = @password and deleted = 0
GO

 ---------------------------------------------------------------------------

--Returns the user who have that access token
CREATE PROCEDURE sp_user_login_provider
	@access_token varchar(max),
	@provider varchar(50)
AS
 SELECT * FROM [user] WHERE id in (
    SELECT user_id FROM user_login WHERE access_token = @access_token AND provider_id = (
        SELECT id FROM provider WHERE name = @provider
    )
 )
GO

---------------------------------------------------------------------------

--Mofidies the user in database
CREATE PROCEDURE sp_update_user
    @id int,
	@email varchar(255),
	@password varchar(64),
    @username varchar(30),
    @profile_picture varbinary(max)
AS
 IF EXISTS(SELECT * FROM [user] WHERE email = @email and id <> @id)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'This email is already in use')
    RETURN
 END

 UPDATE [user] set email = @email, password = @password, username = @username, profile_picture = @profile_picture
 WHERE id = @id

 SELECT * FROM [user] WHERE id = @id
GO

---------------------------------------------------------------------------

--Register a provider as a user media
CREATE PROCEDURE sp_register_user_media
	@provider varchar(50),
	@access_token varchar(max),
	@id int,
	@username AS varchar(30) = ''
AS
 IF EXISTS(SELECT * FROM user_login WHERE access_token = @access_token AND provider_id = (
    SELECT id FROM provider WHERE name = @provider
 ))
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'This account is already registered')
    RETURN
 END
    
 IF @id <= 0
 BEGIN
    INSERT INTO [user] VALUES (NULL, NULL, @username, 1, NULL, 0)
    INSERT INTO user_login VALUES ((SELECT MAX(id) AS user_id FROM [user]), @access_token, (SELECT id as provider_id FROM provider WHERE name = @provider))
    SELECT * FROM [user] WHERE id = (SELECT MAX(id) FROM [user])
 END
 ELSE
    INSERT INTO user_login VALUES (@id, @access_token, (SELECT id AS provider_id FROM provider WHERE name = @provider))
GO

---------------------------------------------------------------------------

--Register a new user
CREATE PROCEDURE sp_register_user
	@email varchar(255),
	@password varchar(64),
	@username varchar(30)
AS
 IF EXISTS(SELECT * FROM [user] WHERE email = @email)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'This email is already registered')
    RETURN
 END
    
 INSERT INTO [user] VALUES (@email, @password, @username, 1, NULL, 0)
 SELECT * FROM [user] WHERE id = (SELECT MAX(id) FROM [user]) 
GO

---------------------------------------------------------------------------

--Saves the settings changes
CREATE PROCEDURE sp_save_settings
    @id int,
    @name varchar(30),
    @email varchar(255),
    @password varchar(64)
AS
 UPDATE [user] SET username = @name, email = @email, password = @password WHERE id = @id
GO

---------------------------------------------------------------------------

--Counts the unreaden notifications from an unser
CREATE PROCEDURE sp_unreaden_notifications
    @id int
AS
 SELECT COUNT(*) as amount FROM notification WHERE user_id = @id and state = 0
GO

---------------------------------------------------------------------------

--Selects the last @amount notifications from an user @id, skipping the @offset
CREATE PROCEDURE sp_user_notifications
    @id int,
    @offset int,
    @amount int
AS
 SELECT TOP(@amount) * FROM (SELECT ROW_NUMBER() OVER(ORDER BY data) AS number, * FROM notification WHERE user_id = @id) indexes WHERE indexes.number > @offset
GO

---------------------------------------------------------------------------

--Selects the last @amount posts in the discussion, skipping the @offset
CREATE PROCEDURE sp_discussion_posts
    @offset int,
    @amount int
AS
 SELECT TOP(@amount) * FROM (SELECT ROW_NUMBER() OVER(ORDER BY posted_on DESC) AS number, * FROM post) indexes WHERE indexes.number > @offset
GO

---------------------------------------------------------------------------

--Selects the comments from a post @id
CREATE PROCEDURE sp_post_comments
    @id int,
    @user_id int
AS
 SELECT * from comment where post_id = @id ORDER BY commented_on
 
 IF NOT EXISTS(SELECT * FROM post_view WHERE post_id = @id AND user_id = @user_id)
    INSERT INTO post_view values (@id, @user_id)
GO

---------------------------------------------------------------------------

--Creates a post in the discussion area
CREATE PROCEDURE sp_post_create
    @user_id int,
    @title varchar(100),
    @message varchar(MAX),
    @area varchar(30)
AS
 IF NOT EXISTS(SELECT * FROM area WHERE name = @area)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid area')
 ELSE
    INSERT INTO post values (@user_id, @title, @message, (SELECT GETDATE()), (SELECT id FROM area WHERE name = @area))
GO

---------------------------------------------------------------------------

--Ads a tag to a post
CREATE PROCEDURE sp_add_tag
    @post_id int,
    @tag varchar(30)
AS
 IF NOT EXISTS(SELECT * FROM tag WHERE name = @tag)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid area')
 ELSE
    INSERT INTO post_tag values (@post_id, (SELECT id FROM tag WHERE name = @tag))
GO

---------------------------------------------------------------------------

--Creates a comment to a post
CREATE PROCEDURE sp_comment_create
    @post_id int,
    @user_id int,
    @message varchar(MAX)
AS
 INSERT INTO comment values (@post_id, @user_id, @message, (SELECT GETDATE()))
GO

---------------------------------------------------------------------------

--Selects @amount couses from starting from @offset of @area
--If @area isn't specified, all areas are selected
CREATE PROCEDURE sp_filter_courses
    @offset int,
    @amount int,
    @area AS varchar(30) = ''
AS
 IF @area <> ''
    IF NOT EXISTS(SELECT * FROM area WHERE name = @area)
        RAISERROR ('%d: %s', 16, 1, 100, 'Invalid area')
    ELSE
        SELECT TOP(@amount) * FROM (
            SELECT ROW_NUMBER() OVER(ORDER BY name) AS number, * FROM course WHERE area_id = (SELECT id FROM area WHERE name = @area)
        ) indexes WHERE indexes.number > @offset
 ELSE
    SELECT TOP(@amount) * FROM (SELECT ROW_NUMBER() OVER(ORDER BY name) AS number, * FROM course) indexes WHERE indexes.number > @offset
GO
     
---------------------------------------------------------------------------

--Selects all the area names
CREATE PROCEDURE sp_area_names
AS
    SELECT * FROM area
GO

---------------------------------------------------------------------------

CREATE PROCEDURE sp_post_views
    @id int
AS
 SELECT COUNT(*) FROM post_view WHERE post_id = @id