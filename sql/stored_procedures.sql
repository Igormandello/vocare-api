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
 IF NOT EXISTS(SELECT * FROM [user] WHERE id = @id)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid user')
    RETURN
 END

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

--Deletes the user from database
CREATE PROCEDURE sp_delete_user
    @id int
AS
 IF NOT EXISTS(SELECT * FROM [user] WHERE id = @id)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'This user id does not exist')
    RETURN
 END

 DELETE FROM notification WHERE user_id = @id
 DELETE FROM user_login WHERE user_id = @id
 UPDATE [user] set email = NULL, password = NULL, username = 'Usuário deletado', profile_picture = NULL, deleted = 1 WHERE id = @id
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
    @amount int,
    @id AS int = 0
AS
 IF @id <= 0
    SELECT TOP(@amount) * FROM (SELECT ROW_NUMBER() OVER(ORDER BY posted_on DESC) AS number, * FROM post) indexes WHERE indexes.number > @offset
 ELSE
    SELECT * FROM post WHERE id = @id
GO

---------------------------------------------------------------------------

--Selects the comments from a post @id
CREATE PROCEDURE sp_post_comments
    @id int,
    @user_id int
AS
 IF NOT EXISTS(SELECT * FROM post WHERE id = @id)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid post')
    RETURN
 END

 IF NOT EXISTS(SELECT * FROM [user] WHERE id = @user_id)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid user')
    RETURN
 END
 
 IF NOT EXISTS(SELECT * FROM post_view WHERE post_id = @id AND user_id = @user_id)
    INSERT INTO post_view values (@id, @user_id)

 SELECT * from comment where post_id = @id ORDER BY commented_on
GO

---------------------------------------------------------------------------

--Save editions
CREATE PROCEDURE sp_edit_post
    @id int,
    @newTitle varchar(100),
    @newMessage varchar(MAX),
    @newArea varchar(30)
AS
 IF NOT EXISTS(SELECT * FROM post WHERE id = @id)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid post')
    RETURN
 END

 IF NOT EXISTS(SELECT * FROM area WHERE name = @newArea)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid area')
    RETURN
 END

 UPDATE post SET title = @newTitle, message = @newMessage, area_id = (SELECT id FROM area WHERE name = @newArea) WHERE id = @id
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
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid area')
    RETURN
 END

 INSERT INTO post values (@user_id, @title, @message, (SELECT GETDATE()), (SELECT id FROM area WHERE name = @area))
 SELECT * FROM post WHERE id = (SELECT MAX(id) FROM post)
GO

---------------------------------------------------------------------------

--Deletes the post from database
CREATE PROCEDURE sp_delete_post
    @id int
AS
 IF NOT EXISTS(SELECT * FROM post WHERE id = @id)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid post id')
    RETURN
 END

 DELETE FROM post_tag WHERE post_id = @id
 DELETE FROM post_view WHERE post_id = @id
 DELETE FROM comment WHERE post_id = @id
 DELETE FROM post WHERE id = @id
GO

---------------------------------------------------------------------------

--Adds a tag to a post
CREATE PROCEDURE sp_add_tag
    @post_id int,
    @tag varchar(30)
AS
 IF NOT EXISTS(SELECT * FROM post WHERE id = @post_id)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid post')
 ELSE IF NOT EXISTS(SELECT * FROM tag WHERE name = @tag)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid tag')
 ELSE
    INSERT INTO post_tag values (@post_id, (SELECT id FROM tag WHERE name = @tag))
GO

---------------------------------------------------------------------------

--Removes a tag from a post
CREATE PROCEDURE sp_remove_tag
    @post_id int,
    @tag varchar(30)
AS
 IF NOT EXISTS(SELECT * FROM post WHERE id = @post_id)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid post')
 ELSE IF NOT EXISTS(SELECT * FROM tag WHERE name = @tag)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid tag')
 ELSE
    DELETE FROM post_tag WHERE post_id = @post_id and tag_id = (SELECT id FROM tag WHERE name = @tag)
GO

---------------------------------------------------------------------------

--List all the tags from a post
CREATE PROCEDURE sp_post_tags
    @post_id int
AS
 IF NOT EXISTS(SELECT * FROM post WHERE id = @post_id)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid post')
 ELSE
    SELECT name FROM tag WHERE id IN (SELECT tag_id from post_tag WHERE post_id = @post_id)
GO

---------------------------------------------------------------------------

--Creates a tag
CREATE PROCEDURE sp_create_tag
    @name varchar(30)
AS
 IF EXISTS(SELECT * FROM tag WHERE UPPER(name) = UPPER(@name))
    RAISERROR ('%d: %s', 16, 1, 100, 'Existent tag')
 ELSE
    INSERT INTO tag VALUES (@name)
GO

---------------------------------------------------------------------------

--Creates a comment to a post
CREATE PROCEDURE sp_comment_create
    @post_id int,
    @user_id int,
    @message varchar(MAX)
AS
 IF NOT EXISTS(SELECT * FROM post WHERE id = @post_id)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid post')
 ELSE IF NOT EXISTS(SELECT * FROM [user] WHERE id = @user_id)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid user')
 ELSE
    INSERT INTO comment values (@post_id, @user_id, @message, (SELECT GETDATE()))
GO

---------------------------------------------------------------------------

--Updates a comment's message
CREATE PROCEDURE sp_update_comment
    @id int,
    @message varchar(MAX)
AS
 IF NOT EXISTS(SELECT * FROM comment WHERE id = @id)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid comment')
 ELSE
    UPDATE comment SET message = @message WHERE id = @id
GO

---------------------------------------------------------------------------

--Delete a comment
CREATE PROCEDURE sp_delete_comment
    @id int
AS
 IF NOT EXISTS(SELECT * FROM comment WHERE id = @id)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid comment')
 ELSE
    DELETE FROM comment WHERE id = @id
GO

---------------------------------------------------------------------------

--Creates a course
CREATE PROCEDURE sp_create_course
    @name varchar(50),
    @shortname varchar(30),
    @description varchar(300),
    @area_name varchar(30)
AS
 IF NOT EXISTS(SELECT * FROM area WHERE name = @area_name)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid area')
 ELSE
    INSERT INTO course values (@name, @shortname, @description, (SELECT id FROM area WHERE name = @area_name))
GO

---------------------------------------------------------------------------

--Selects @amount couses from area, starting from @offset
CREATE PROCEDURE sp_filter_courses
    @offset int,
    @amount int,
    @area varchar(30)
AS
 IF NOT EXISTS(SELECT * FROM area WHERE name = @area)
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid area')
 ELSE
    SELECT TOP(@amount) * FROM (
        SELECT ROW_NUMBER() OVER(ORDER BY name) AS number, * FROM course WHERE area_id = (SELECT id FROM area WHERE name = @area)
    ) indexes WHERE indexes.number > @offset
GO
     
---------------------------------------------------------------------------

--Selects all the areas
CREATE PROCEDURE sp_areas
    @id AS int = 0
AS
 IF @id <= 0
    SELECT * FROM area
 ELSE
    SELECT * FROM area WHERE id = @id
GO

---------------------------------------------------------------------------

--Selects all the tags
CREATE PROCEDURE sp_tags
    @id AS int = 0
AS
 IF @id <= 0
    SELECT * FROM tag
 ELSE
    SELECT * FROM tag WHERE id = @id
GO

---------------------------------------------------------------------------

--Selects all the users names
CREATE PROCEDURE sp_users
    @id AS int = 0
AS
 IF @id <= 0
    SELECT * FROM [user] where deleted = 0
 ELSE
    SELECT * FROM [user] where id = @id and deleted = 0
GO

---------------------------------------------------------------------------

--Selects all the commments
CREATE PROCEDURE sp_comments
    @id AS int = 0
AS
 IF @id <= 0
    SELECT * FROM comment
 ELSE
    SELECT * FROM comment where id = @id
GO

---------------------------------------------------------------------------

--Selects all the courses
CREATE PROCEDURE sp_courses
    @id AS int = 0
AS
 IF @id <= 0
    SELECT * FROM course
 ELSE
    SELECT * FROM course where id = @id
GO

---------------------------------------------------------------------------

CREATE PROCEDURE sp_post_views
    @id int
AS
 IF NOT EXISTS(SELECT * FROM post WHERE id = @id)
 BEGIN
    RAISERROR ('%d: %s', 16, 1, 100, 'Invalid post id')
    RETURN
 END

 SELECT COUNT(*) AS views FROM post_view WHERE post_id = @id