-- Bairros atendidos (edite à vontade pelo painel admin ou aqui)
insert into public.bairros (nome, cidade) values
 ('Jardim Camburi','Vitória'),('Jardim da Penha','Vitória'),('Mata da Praia','Vitória'),('Praia do Canto','Vitória'),
 ('Bento Ferreira','Vitória'),('Centro','Vitória'),('Enseada do Suá','Vitória'),('Santa Lúcia','Vitória'),('Maruípe','Vitória'),
 ('Goiabeiras','Vitória'),('República','Vitória'),('Santa Luíza','Vitória'),
 ('Praia da Costa','Vila Velha'),('Itapuã','Vila Velha'),('Centro','Vila Velha'),('Glória','Vila Velha'),('Coqueiral de Itaparica','Vila Velha'),
 ('Laranjeiras','Serra'),('Serra Sede','Serra'),('Jacaraípe','Serra'),('Morada de Laranjeiras','Serra'),
 ('Campo Grande','Cariacica'),('Jardim América','Cariacica'),('Itacibá','Cariacica')
on conflict (nome, cidade) do nothing;
