--Counts the total messages from an user
--Messages = Posts + Comments
CREATE PROCEDURE sp_count_messages
	@user_id int
AS
 SELECT SUM(post.[count] + comment.[count]) AS [count] FROM
 (SELECT COUNT(*) AS [count] FROM post WHERE user_id = @user_id) post,
 (SELECT COUNT(*) AS [count] FROM comment WHERE user_id = @user_id) comment

 ---------------------------------------------------------------------------

--Returns the user who have that email and password
CREATE PROCEDURE sp_user_login
	@email varchar(255),
	@password varchar(64)
AS
 SELECT * FROM [user] WHERE email = @email and password = @password
 
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
    INSERT INTO [user] VALUES (NULL, NULL, @username, 1, NULL)
    INSERT INTO user_login VALUES ((SELECT MAX(id) AS user_id FROM [user]), @access_token, (SELECT id as prover_id FROM provider WHERE name = @provider))
 END
 ELSE
    INSERT INTO user_login VALUES (@id, @access_token, (SELECT id AS prover_id FROM provider WHERE name = @provider))
 
---------------------------------------------------------------------------

--Saves the settings changes
CREATE PROCEDURE sp_save_settings
    @id int,
    @name varchar(30),
    @email varchar(255),
    @password varchar(64)
AS
 UPDATE [user] SET username = @name, email = @email, password = @password WHERE id = @id

---------------------------------------------------------------------------

--Counts the unreaden notifications from an unser
CREATE PROCEDURE sp_unreaden_notifications
    @id int
AS
 SELECT COUNT(*) as amount FROM notification WHERE user_id = @id and state = 0

---------------------------------------------------------------------------

--Selects the last @amount notifications from an user @id, skipping the @offset
CREATE PROCEDURE sp_user_notifications
    @id int,
    @offset int,
    @amount int
AS
 SELECT TOP(@amount) * FROM (SELECT ROW_NUMBER() OVER(order by data) AS number, * FROM notification WHERE user_id = @id) indexes WHERE indexes.number > @offset

---------------------------------------------------------------------------

