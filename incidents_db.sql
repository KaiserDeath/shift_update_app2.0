--
-- PostgreSQL database dump
--

\restrict VQCeM104IvvJL3KkW83fKYOld4MeIpHSa4P9FsOgtriIMx4fzcpZLrkyIsDxQlD

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-02-24 15:44:22

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16421)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 16402)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16401)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 222
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 221 (class 1259 OID 16390)
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name text
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16389)
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO postgres;

--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 220
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- TOC entry 224 (class 1259 OID 16413)
-- Name: incidents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incidents (
    id text NOT NULL,
    "timestamp" text,
    shift text,
    category text,
    company text,
    description text,
    action_taken text,
    status text,
    operator text
);


ALTER TABLE public.incidents OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16448)
-- Name: user_functions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_functions (
    id integer NOT NULL,
    username text NOT NULL,
    function_name text NOT NULL
);


ALTER TABLE public.user_functions OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16447)
-- Name: user_functions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_functions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_functions_id_seq OWNER TO postgres;

--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 226
-- Name: user_functions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_functions_id_seq OWNED BY public.user_functions.id;


--
-- TOC entry 225 (class 1259 OID 16432)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['operator'::character varying, 'supervisor'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4886 (class 2604 OID 16405)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4885 (class 2604 OID 16393)
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- TOC entry 4888 (class 2604 OID 16451)
-- Name: user_functions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_functions ALTER COLUMN id SET DEFAULT nextval('public.user_functions_id_seq'::regclass);


--
-- TOC entry 5057 (class 0 OID 16402)
-- Dependencies: 223
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name) FROM stdin;
1	Depositos
2	Cashouts
3	Bonos
4	Glitches
5	Freeplay
\.


--
-- TOC entry 5055 (class 0 OID 16390)
-- Dependencies: 221
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name) FROM stdin;
1	Play Play Play
2	Lucky Lady
3	WiseGang
4	Ballerz
5	Fast Fortunes
100	Slot House
\.


--
-- TOC entry 5058 (class 0 OID 16413)
-- Dependencies: 224
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incidents (id, "timestamp", shift, category, company, description, action_taken, status, operator) FROM stdin;
ffa0275e-7c70-40c1-8190-22a6fc8c013c	2026-02-20 12:31:56	Morning	Bonos	Lucky Lady	Lose	si se	Resolved	Operator
02ac2dfa-8bef-4278-a26b-c214fcd1643d	2026-02-20 12:00:44	Morning	Bonos	WiseGang	HH ACTIVO DESDE LAS 7 PM HOY	Desactivar a 23:59pm mañana	Pending	Operator
0ddb3ed7-822c-4821-8fc2-5041940bd8db	2026-02-20 13:12:33	Evening	Glitches	Ballerz	Cx indicated there was a GLITCH on Panda Master	Contacter the brand to check this 	Important	Operator
fa454ed4-bc3c-4994-b324-248ab8af8c72	2026-02-24 11:02:47	Evening	Cashouts	Fast Fortunes	Yo si fui 	Fui yo	Resolved	Abel
dee9c5b3-1c67-4040-9726-b5cd1b1304e4	2026-02-20 13:21:22	Morning	Depositos	Lucky Lady	test 	test	Pending	Operator
28a82f63-6170-49d7-8d1d-bcfbc8ec9fad	2026-02-20 14:19:26	Morning	Cashouts	Fast Fortunes	testt	testt	Important	Operator
5573a3f3-df84-4fcb-a339-73a5e7ed4857	2026-02-20 12:05:28	Evening	Cashouts	Fast Fortunes	YOOOO	tuuuuu	Pending	Operator
16517e53-5475-4c3e-893a-a8cad3044c46	2026-02-20 14:29:26	Evening	Cashouts	WiseGang	FUE LEONEOL	EN LA PLAZA DE ARMAS	Important	Operator
379b1740-fc9f-437d-a52f-783c109f6fb3	2026-02-20 12:05:33	Morning	Cashouts	Lucky Lady	NOOO se perdio	se recupero	Resolved	Operator
0ce74672-bf67-4476-a418-5fcd0fe2d2ee	2026-02-20 14:31:23	Morning	Cashouts	Ballerz	A partir de hoydia , ya no senvia a al chat de whatsapp	Hasta nuevo aviso	Important	Operator
981b9918-95fc-47c6-a66d-c32d5114524b	2026-02-20 12:56:15	Morning	Depositos	Lucky Lady	yooo 	test	Important	Operator
ee3167f5-9944-421c-969b-651e042c7281	2026-02-20 12:00:33	Morning	Cashouts	Fast Fortunes	No se paga hasta las 12	desde las 12 y hasta las 6 am unicamente	Important	Operator
1885b54c-46ca-45a9-b222-d9e5ebbc83d0	2026-02-20 12:00:20	Evening	Bonos	Play Play Play	hh montos han sido mofificados	esto son los nuevos rangos\n10-50 - 2\n51-100 - 3\n100-150 - 10	Resolved	Operator
b18fbe48-ca0d-4508-aaa4-0ca2297c34fb	2026-02-20 15:00:13	Morning	Cashouts	Ballerz	asssssssssssssssssssa cliente dice que no se le pago correo test@gmail.com	consultando con  dovera	Pending	Operator
c1f1a308-491d-41b2-b5c3-168202df6196	2026-02-23 09:13:02	Morning	Cashouts	Fast Fortunes	Yooo	nooooo	Resolved	Operator
2e455836-77a1-4aa5-bf8f-9a05dee8bdbc	2026-02-23 15:28:10	Evening	Depositos	Lucky Lady	CLIENTE TAL SE EQUIVIO	SE COMUNICO CON DOVERA ESPERANDO RESPUESTA	Important	admin
cb9ff108-db24-4dd1-819c-1066fb841fc2	2026-02-23 16:30:32	Morning	Depositos	Lucky Lady	Cliente deposito y no aparece en nuestro sistema apesar de mandar pruebas 	Se contacto con proveedor de pago para revisar el caso	Pending	Pedro
\.


--
-- TOC entry 5061 (class 0 OID 16448)
-- Dependencies: 227
-- Data for Name: user_functions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_functions (id, username, function_name) FROM stdin;
\.


--
-- TOC entry 5059 (class 0 OID 16432)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, role) FROM stdin;
6e1633f7-96d8-48cb-beb7-dd4a637a9b01	admin	$2b$12$Y.6mdlhtN4wwJINVpH3LVuKI/fy1MPblaRSvdBh6gstfuhW7ls.fa	admin
bac3dbeb-85e4-4bd2-8d5d-2c768d41c54f	Pedro	$2b$12$UPQbpVNbC3b54agLET8Wq.zylpR22KCYM03su8XugllszclFXclJq	operator
d215cab9-8430-42fd-ab8b-a26bad12ea09	Melanie	$2b$12$BTAiWMzJxGOsZdWTFoic0.Mj8rJmkD.xkJTMtQHWiRZ1PhWJz9xWK	supervisor
0a401312-ec81-4def-9f2c-ccd2a7dc5bf5	Jostyn	$2b$12$opiFcOWCCSxLvL73cCVsAuKE.NXOf548Ec5clMdsnSGWGThMnp/66	operator
27a11b02-13f5-4428-9e1c-9226b2d55844	LuisAce	$2b$12$yx9JqzC3rRa.YGYfMM.J6Or2H083BMOT7gyn7TampTJhb4csEaVrG	operator
a54573c2-96c2-4e09-bed0-3c49bd2c7fbf	Abel	$2b$12$Hs/beU9a.KU7R/FjIISlMOkDDCX9Vm9f7oDoB6P.ReU7f3LkKzPwq	supervisor
\.


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 222
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 119, true);


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 220
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_id_seq', 122, true);


--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 226
-- Name: user_functions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_functions_id_seq', 51, true);


--
-- TOC entry 4895 (class 2606 OID 16412)
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- TOC entry 4897 (class 2606 OID 16410)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 16400)
-- Name: companies companies_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_name_key UNIQUE (name);


--
-- TOC entry 4893 (class 2606 OID 16398)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- TOC entry 4899 (class 2606 OID 16420)
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- TOC entry 4905 (class 2606 OID 16458)
-- Name: user_functions user_functions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_functions
    ADD CONSTRAINT user_functions_pkey PRIMARY KEY (id);


--
-- TOC entry 4901 (class 2606 OID 16444)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 16446)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4906 (class 2606 OID 16459)
-- Name: user_functions user_functions_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_functions
    ADD CONSTRAINT user_functions_username_fkey FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;


-- Completed on 2026-02-24 15:44:22

--
-- PostgreSQL database dump complete
--

\unrestrict VQCeM104IvvJL3KkW83fKYOld4MeIpHSa4P9FsOgtriIMx4fzcpZLrkyIsDxQlD

