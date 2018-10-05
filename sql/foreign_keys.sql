ALTER TABLE [user_login]  WITH CHECK ADD  CONSTRAINT [FK_user_login_user] FOREIGN KEY([user_id])
REFERENCES [user] ([id])
ALTER TABLE [user_login] CHECK CONSTRAINT [FK_user_login_user]


ALTER TABLE [user_login]  WITH CHECK ADD  CONSTRAINT [FK_user_login_provider] FOREIGN KEY([provider_id])
REFERENCES [provider] ([id])

ALTER TABLE [user_login] CHECK CONSTRAINT [FK_user_login_provider]

------------------------

ALTER TABLE [post_view]  WITH CHECK ADD  CONSTRAINT [FK_post_view_user] FOREIGN KEY([user_id])
REFERENCES [user] ([id])

ALTER TABLE [post_view] CHECK CONSTRAINT [FK_post_view_user]


ALTER TABLE [post_view]  WITH CHECK ADD  CONSTRAINT [FK_post_view_post] FOREIGN KEY([post_id])
REFERENCES [post] ([id])

ALTER TABLE [post_view] CHECK CONSTRAINT [FK_post_view_post]

------------------------

ALTER TABLE [post_tag]  WITH CHECK ADD  CONSTRAINT [FK_post_tag_tag] FOREIGN KEY([tag_id])
REFERENCES [tag] ([id])

ALTER TABLE [post_tag] CHECK CONSTRAINT [FK_post_tag_tag]


ALTER TABLE [post_tag]  WITH CHECK ADD  CONSTRAINT [FK_post_tag_post] FOREIGN KEY([post_id])
REFERENCES [post] ([id])

ALTER TABLE [post_tag] CHECK CONSTRAINT [FK_post_tag_post]

------------------------

ALTER TABLE [post]  WITH CHECK ADD  CONSTRAINT [FK_post_user] FOREIGN KEY([user_id])
REFERENCES [user] ([id])

ALTER TABLE [post] CHECK CONSTRAINT [FK_post_user]


ALTER TABLE [post]  WITH CHECK ADD  CONSTRAINT [FK_post_area] FOREIGN KEY([area_id])
REFERENCES [area] ([id])

ALTER TABLE [post] CHECK CONSTRAINT [FK_post_area]

------------------------

ALTER TABLE [notification]  WITH CHECK ADD  CONSTRAINT [FK_notification_user] FOREIGN KEY([user_id])
REFERENCES [user] ([id])

ALTER TABLE [notification] CHECK CONSTRAINT [FK_notification_user]

------------------------

ALTER TABLE [course]  WITH CHECK ADD  CONSTRAINT [FK_course_area] FOREIGN KEY([area_id])
REFERENCES [area] ([id])

ALTER TABLE [course] CHECK CONSTRAINT [FK_course_area]

------------------------

ALTER TABLE [comment]  WITH CHECK ADD  CONSTRAINT [FK_comment_user] FOREIGN KEY([user_id])
REFERENCES [user] ([id])

ALTER TABLE [comment] CHECK CONSTRAINT [FK_comment_user]


ALTER TABLE [comment]  WITH CHECK ADD  CONSTRAINT [FK_comment_post] FOREIGN KEY([post_id])
REFERENCES [post] ([id])

ALTER TABLE [comment] CHECK CONSTRAINT [FK_comment_post]