select * from provider
select * from tag
select * from area
select * from [user]
select * from user_login
select * from notification
select * from post
select * from post_tag
select * from comment
select * from post_view
select * from course

---------------------------------------------------------

insert into provider values ('google')
insert into provider values ('github')
insert into provider values ('reddit')
insert into provider values ('twitter')
insert into provider values ('facebook')

---------------------------------------------------------

insert into tag values ('Dúvida')
insert into tag values ('Urgente')
insert into tag values ('Debate')

---------------------------------------------------------

insert into area values ('Exatas')
insert into area values ('Humanas')
insert into area values ('Biológicas')

---------------------------------------------------------

insert into [user] values ('igormandello@gmail.com', 
						   'bf9914a2967c5db5c70a3f16039b75e5edbb949a74bc370f6920aebe96e29e1b', 
						   'Igor Mandello',
						   3,
						   NULL, 0)
insert into [user] values ('vitorbartier@hotmail.com', 
						   'bf9914a2967c5db5c70a3f16039b75e5edbb949a74bc370f6920aebe96e29e1b', 
						   'Vitor Bartier',
						   3,
						   NULL, 0)
insert into [user] values ('lucashideki@gmail.com', 
						   'bf9914a2967c5db5c70a3f16039b75e5edbb949a74bc370f6920aebe96e29e1b', 
						   'Lucas Hideki',
						   4,
						   NULL, 0)
insert into [user] values ('lucasvvop@gmail.com', 
						   'bf9914a2967c5db5c70a3f16039b75e5edbb949a74bc370f6920aebe96e29e1b', 
						   'Lucas Valente',
						   3,
						   NULL, 0)

---------------------------------------------------------

insert into user_login values (1, 'access_token', 2)

---------------------------------------------------------

insert into notification values (1, '10 usuários gostaram de sua pergunta!', '2018-07-04 16:34:00', 1)
insert into notification values (1, 'O usuário Vitor Bartier criou uma pergunta relacionada a você, que tal ajudá-lo?', '2018-11-08 09:21:00', 1)
insert into notification values (1, 'Parabéns! Você atingiu o nível 3. Continue firme na sua jornada!', '2018-14-09 13:50:00', 0)

---------------------------------------------------------

insert into post values (2,
						 'Eu tenho uma dúvida: o que é melhor entre ciência da computação e engenharia da computação?',
						 'Então gente, acho que bastantes usuários tem essa mesma dúvida então estou lançando aqui (claro que para me ajudar também 😅), quais são as diferenças entre os cursos, qual é melhor, qual eu deveria cursar? Se alguém conseguir ajudar ficaria bem feliz!!',
						 '2018-04-09 19:02:00',
						 1)
insert into post values (1,
						 'Análise e Desenvolvimento de Sistemas vale a pena?',
						 'Galera, tava bem em dúvida entre ela, ciência da computação e engenharia da computação, hoje em dia ainda vale a pena fazer esse curso? Se sim, por quê? Obrigado.',
						 '2018-03-09 15:42:00',
						 1)
insert into post values (4,
						 'Engenharia da Computação é muito corrido?',
						 'Eu estou terminando meu técnico e provavelmente vou estagiar, será que se eu escolher cursar Engenharia, eu vou acabar não dando conta do trabalho?',
						 '2018-20-08 12:15:00',
						 1)

---------------------------------------------------------

insert into post_tag values (1, 1)
insert into post_tag values (2, 3)
insert into post_tag values (3, 2)

---------------------------------------------------------

insert into comment values (1,
							1, 
							'Olha cara, eu to com a mesma dúvida que você, e sinceramente, eu estou indo mais para o lado da ciência, estou fazendo isso porque a carga horária, além de ser menor, é mais viável para mim, pois fiz técnico e gostaria de estagiar também... Outro motivo também é o currículo, já que em engenharia, acabamos tendo matérias que eu não gostaria de fazer, como física e química.',
							'2018-04-09 19:32:00')
insert into comment values (1,
							3, 
							'Oi galera! Estou cursando o bacharel em ciência da computação e estou gostando bastante da decisão que fiz. Quando precisei acatar qual curso eu iria escolher, fui bastante pelo ponto do Igor, por isso estou fazendo esse. Mas na faculdade tenho amigos que fazem engenharia também, e eles dizem que não é tão ruim, apenas mais puxado.',
							'2018-04-09 20:17:00')
insert into comment values (1,
							2, 
							'Obrigado gente 😄! As respostas ajudaram bastante, agora vou dar uma pensada melhor e ver se eu chego em uma conclusão, qualquer coisa, vou reabrir essa discussão.',
							'2018-05-09 12:45:00')

---------------------------------------------------------

insert into post_view values (1, 1)
insert into post_view values (3, 1)
insert into post_view values (2, 1)
insert into post_view values (1, 2)
insert into post_view values (4, 2)
insert into post_view values (4, 3)
insert into post_view values (1, 3)

---------------------------------------------------------

insert into course values ('Ciência da Computação',
						   'cienciaDaComputacao',
						   'O estudante de Ciência da Computação trabalha principalmente com o desenvolvimento de programas para as mais diversas plataformas, como celulares, tablets e computadores.',
						   1)
insert into course values ('Engenharia Mecânica',
						   'engenhariaMecanica',
						   'A Engenharia Mecânica é o ramo da engenharia que cuida do projeto, construção, análise, operação e manutenção de sistemas mecânicos.',
						   1)
insert into course values ('Medicina',
						   'medicina',
						   'A função do Médico é pesquisar as doenças e suas causas para poder posteriormente combatê-las e curá-las. Conheça mais sobre a carreira de Medicina.',
						   3)

---------------------------------------------------------