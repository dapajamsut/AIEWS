--
-- PostgreSQL database dump
--

\restrict QCcoYEvSeLX1PmzTrFL8plCTtzyjLhQyhmbdfyyikneg5C8XEo4smaJFtkJVcbB

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-13 17:01:03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
--SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 16817)
-- Name: ai_prediction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_prediction (
    id integer NOT NULL,
    node_id integer,
    predicted_water_level double precision,
    predicted_status character varying(20),
    prediction_time timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ai_prediction OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16816)
-- Name: ai_prediction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_prediction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_prediction_id_seq OWNER TO postgres;

--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 233
-- Name: ai_prediction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_prediction_id_seq OWNED BY public.ai_prediction.id;


--
-- TOC entry 230 (class 1259 OID 16784)
-- Name: cctv_capture; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cctv_capture (
    id integer NOT NULL,
    node_id integer,
    image_url text,
    trash_detected boolean DEFAULT false,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cctv_capture OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16783)
-- Name: cctv_capture_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cctv_capture_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cctv_capture_id_seq OWNER TO postgres;

--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 229
-- Name: cctv_capture_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cctv_capture_id_seq OWNED BY public.cctv_capture.id;


--
-- TOC entry 228 (class 1259 OID 16770)
-- Name: environment_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.environment_data (
    id integer NOT NULL,
    node_id integer,
    temperature double precision,
    humidity double precision,
    pressure double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.environment_data OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16769)
-- Name: environment_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.environment_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.environment_data_id_seq OWNER TO postgres;

--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 227
-- Name: environment_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.environment_data_id_seq OWNED BY public.environment_data.id;


--
-- TOC entry 240 (class 1259 OID 16860)
-- Name: flood_alert_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flood_alert_history (
    id integer NOT NULL,
    node_id integer,
    alert_level character varying(20),
    water_level_cm double precision,
    message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.flood_alert_history OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16859)
-- Name: flood_alert_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flood_alert_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flood_alert_history_id_seq OWNER TO postgres;

--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 239
-- Name: flood_alert_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flood_alert_history_id_seq OWNED BY public.flood_alert_history.id;


--
-- TOC entry 232 (class 1259 OID 16801)
-- Name: flood_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flood_status (
    id integer NOT NULL,
    node_id integer,
    water_level_cm double precision,
    status_level character varying(20),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.flood_status OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16800)
-- Name: flood_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flood_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flood_status_id_seq OWNER TO postgres;

--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 231
-- Name: flood_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flood_status_id_seq OWNED BY public.flood_status.id;


--
-- TOC entry 220 (class 1259 OID 16719)
-- Name: node_device; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.node_device (
    id integer NOT NULL,
    node_name character varying(50),
    location character varying(100),
    latitude numeric(10,6),
    longitude numeric(10,6),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.node_device OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16718)
-- Name: node_device_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.node_device_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.node_device_id_seq OWNER TO postgres;

--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 219
-- Name: node_device_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.node_device_id_seq OWNED BY public.node_device.id;


--
-- TOC entry 224 (class 1259 OID 16742)
-- Name: rain_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rain_data (
    id integer NOT NULL,
    node_id integer,
    rainfall_mm double precision,
    tip_count integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rain_data OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16728)
-- Name: water_level_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.water_level_data (
    id integer NOT NULL,
    node_id integer,
    water_level_cm double precision,
    distance_cm double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.water_level_data OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16756)
-- Name: wind_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wind_data (
    id integer NOT NULL,
    node_id integer,
    wind_speed double precision,
    wind_direction double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wind_data OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16741)
-- Name: rain_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rain_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rain_data_id_seq OWNER TO postgres;

--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 223
-- Name: rain_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rain_data_id_seq OWNED BY public.rain_data.id;


--
-- TOC entry 242 (class 1259 OID 16876)
-- Name: sensor_health; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensor_health (
    id integer NOT NULL,
    node_id integer,
    sensor_type character varying(50),
    status character varying(20),
    last_seen timestamp without time zone,
    battery_level double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sensor_health OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16875)
-- Name: sensor_health_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensor_health_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sensor_health_id_seq OWNER TO postgres;

--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 241
-- Name: sensor_health_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensor_health_id_seq OWNED BY public.sensor_health.id;


--
-- TOC entry 238 (class 1259 OID 16844)
-- Name: system_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_logs OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16843)
-- Name: system_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 237
-- Name: system_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_logs_id_seq OWNED BY public.system_logs.id;


--
-- TOC entry 236 (class 1259 OID 16831)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50),
    password_hash text,
    role character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16830)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 235
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 221 (class 1259 OID 16727)
-- Name: water_level_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.water_level_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.water_level_data_id_seq OWNER TO postgres;

--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 221
-- Name: water_level_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.water_level_data_id_seq OWNED BY public.water_level_data.id;


--
-- TOC entry 225 (class 1259 OID 16755)
-- Name: wind_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wind_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wind_data_id_seq OWNER TO postgres;

--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 225
-- Name: wind_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wind_data_id_seq OWNED BY public.wind_data.id;


--
-- TOC entry 4917 (class 2604 OID 16820)
-- Name: ai_prediction id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prediction ALTER COLUMN id SET DEFAULT nextval('public.ai_prediction_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 16787)
-- Name: cctv_capture id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cctv_capture ALTER COLUMN id SET DEFAULT nextval('public.cctv_capture_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 16773)
-- Name: environment_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.environment_data ALTER COLUMN id SET DEFAULT nextval('public.environment_data_id_seq'::regclass);


--
-- TOC entry 4923 (class 2604 OID 16863)
-- Name: flood_alert_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flood_alert_history ALTER COLUMN id SET DEFAULT nextval('public.flood_alert_history_id_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 16804)
-- Name: flood_status id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flood_status ALTER COLUMN id SET DEFAULT nextval('public.flood_status_id_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 16722)
-- Name: node_device id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.node_device ALTER COLUMN id SET DEFAULT nextval('public.node_device_id_seq'::regclass);


--
-- TOC entry 4906 (class 2604 OID 16745)
-- Name: rain_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rain_data ALTER COLUMN id SET DEFAULT nextval('public.rain_data_id_seq'::regclass);


--
-- TOC entry 4925 (class 2604 OID 16879)
-- Name: sensor_health id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_health ALTER COLUMN id SET DEFAULT nextval('public.sensor_health_id_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 16847)
-- Name: system_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN id SET DEFAULT nextval('public.system_logs_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 16834)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4904 (class 2604 OID 16731)
-- Name: water_level_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.water_level_data ALTER COLUMN id SET DEFAULT nextval('public.water_level_data_id_seq'::regclass);


--
-- TOC entry 4908 (class 2604 OID 16759)
-- Name: wind_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wind_data ALTER COLUMN id SET DEFAULT nextval('public.wind_data_id_seq'::regclass);


--
-- TOC entry 5132 (class 0 OID 16817)
-- Dependencies: 234
-- Data for Name: ai_prediction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_prediction (id, node_id, predicted_water_level, predicted_status, prediction_time, created_at) FROM stdin;
\.


--
-- TOC entry 5128 (class 0 OID 16784)
-- Dependencies: 230
-- Data for Name: cctv_capture; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cctv_capture (id, node_id, image_url, trash_detected, description, created_at) FROM stdin;
\.


--
-- TOC entry 5126 (class 0 OID 16770)
-- Dependencies: 228
-- Data for Name: environment_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.environment_data (id, node_id, temperature, humidity, pressure, created_at) FROM stdin;
1	1	29	82	1007	2026-03-13 15:05:06.82338
\.


--
-- TOC entry 5138 (class 0 OID 16860)
-- Dependencies: 240
-- Data for Name: flood_alert_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flood_alert_history (id, node_id, alert_level, water_level_cm, message, created_at) FROM stdin;
\.


--
-- TOC entry 5130 (class 0 OID 16801)
-- Dependencies: 232
-- Data for Name: flood_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flood_status (id, node_id, water_level_cm, status_level, description, created_at) FROM stdin;
1	1	135	SIAGA 1	hati hati potensi kenaikan air	2026-03-13 15:05:06.82338
\.


--
-- TOC entry 5118 (class 0 OID 16719)
-- Dependencies: 220
-- Data for Name: node_device; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.node_device (id, node_name, location, latitude, longitude, created_at) FROM stdin;
1	Node Sungai A	Depok	-6.394000	106.822000	2026-03-13 15:04:57.353947
\.


--
-- TOC entry 5122 (class 0 OID 16742)
-- Dependencies: 224
-- Data for Name: rain_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rain_data (id, node_id, rainfall_mm, tip_count, created_at) FROM stdin;
1	1	5.2	26	2026-03-13 15:05:06.82338
\.


--
-- TOC entry 5140 (class 0 OID 16876)
-- Dependencies: 242
-- Data for Name: sensor_health; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sensor_health (id, node_id, sensor_type, status, last_seen, battery_level, created_at) FROM stdin;
1	1	gateway	ONLINE	2026-03-13 15:05:06.881885	3.9	2026-03-13 15:05:06.82338
\.


--
-- TOC entry 5136 (class 0 OID 16844)
-- Dependencies: 238
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_logs (id, user_id, action, description, created_at) FROM stdin;
\.


--
-- TOC entry 5134 (class 0 OID 16831)
-- Dependencies: 236
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, role, created_at) FROM stdin;
\.


--
-- TOC entry 5120 (class 0 OID 16728)
-- Dependencies: 222
-- Data for Name: water_level_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.water_level_data (id, node_id, water_level_cm, distance_cm, created_at) FROM stdin;
3	1	135	65	2026-03-13 15:05:06.82338
\.


--
-- TOC entry 5124 (class 0 OID 16756)
-- Dependencies: 226
-- Data for Name: wind_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wind_data (id, node_id, wind_speed, wind_direction, created_at) FROM stdin;
1	1	3.5	180	2026-03-13 15:05:06.82338
\.


--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 233
-- Name: ai_prediction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_prediction_id_seq', 1, false);


--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 229
-- Name: cctv_capture_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cctv_capture_id_seq', 1, false);


--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 227
-- Name: environment_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.environment_data_id_seq', 1, true);


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 239
-- Name: flood_alert_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.flood_alert_history_id_seq', 1, false);


--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 231
-- Name: flood_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.flood_status_id_seq', 1, true);


--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 219
-- Name: node_device_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.node_device_id_seq', 1, true);


--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 223
-- Name: rain_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rain_data_id_seq', 1, true);


--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 241
-- Name: sensor_health_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sensor_health_id_seq', 1, true);


--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 237
-- Name: system_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_logs_id_seq', 1, false);


--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 235
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 221
-- Name: water_level_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.water_level_data_id_seq', 3, true);


--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 225
-- Name: wind_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wind_data_id_seq', 1, true);


--
-- TOC entry 4946 (class 2606 OID 16824)
-- Name: ai_prediction ai_prediction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prediction
    ADD CONSTRAINT ai_prediction_pkey PRIMARY KEY (id);


--
-- TOC entry 4942 (class 2606 OID 16794)
-- Name: cctv_capture cctv_capture_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cctv_capture
    ADD CONSTRAINT cctv_capture_pkey PRIMARY KEY (id);


--
-- TOC entry 4939 (class 2606 OID 16777)
-- Name: environment_data environment_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.environment_data
    ADD CONSTRAINT environment_data_pkey PRIMARY KEY (id);


--
-- TOC entry 4954 (class 2606 OID 16869)
-- Name: flood_alert_history flood_alert_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flood_alert_history
    ADD CONSTRAINT flood_alert_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4944 (class 2606 OID 16810)
-- Name: flood_status flood_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flood_status
    ADD CONSTRAINT flood_status_pkey PRIMARY KEY (id);


--
-- TOC entry 4928 (class 2606 OID 16726)
-- Name: node_device node_device_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.node_device
    ADD CONSTRAINT node_device_pkey PRIMARY KEY (id);


--
-- TOC entry 4934 (class 2606 OID 16749)
-- Name: rain_data rain_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rain_data
    ADD CONSTRAINT rain_data_pkey PRIMARY KEY (id);


--
-- TOC entry 4958 (class 2606 OID 16883)
-- Name: sensor_health sensor_health_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_health
    ADD CONSTRAINT sensor_health_pkey PRIMARY KEY (id);


--
-- TOC entry 4952 (class 2606 OID 16853)
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4948 (class 2606 OID 16840)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4950 (class 2606 OID 16842)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4931 (class 2606 OID 16735)
-- Name: water_level_data water_level_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.water_level_data
    ADD CONSTRAINT water_level_data_pkey PRIMARY KEY (id);


--
-- TOC entry 4937 (class 2606 OID 16763)
-- Name: wind_data wind_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wind_data
    ADD CONSTRAINT wind_data_pkey PRIMARY KEY (id);


--
-- TOC entry 4955 (class 1259 OID 16898)
-- Name: idx_alert_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_time ON public.flood_alert_history USING btree (created_at);


--
-- TOC entry 4940 (class 1259 OID 16896)
-- Name: idx_env_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_env_time ON public.environment_data USING btree (created_at);


--
-- TOC entry 4932 (class 1259 OID 16895)
-- Name: idx_rain_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rain_time ON public.rain_data USING btree (created_at);


--
-- TOC entry 4956 (class 1259 OID 16899)
-- Name: idx_sensor_health_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sensor_health_time ON public.sensor_health USING btree (last_seen);


--
-- TOC entry 4929 (class 1259 OID 16894)
-- Name: idx_water_level_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_water_level_time ON public.water_level_data USING btree (created_at);


--
-- TOC entry 4935 (class 1259 OID 16897)
-- Name: idx_wind_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wind_time ON public.wind_data USING btree (created_at);


--
-- TOC entry 4965 (class 2606 OID 16825)
-- Name: ai_prediction ai_prediction_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_prediction
    ADD CONSTRAINT ai_prediction_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node_device(id);


--
-- TOC entry 4963 (class 2606 OID 16795)
-- Name: cctv_capture cctv_capture_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cctv_capture
    ADD CONSTRAINT cctv_capture_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node_device(id);


--
-- TOC entry 4962 (class 2606 OID 16778)
-- Name: environment_data environment_data_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.environment_data
    ADD CONSTRAINT environment_data_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node_device(id);


--
-- TOC entry 4967 (class 2606 OID 16870)
-- Name: flood_alert_history flood_alert_history_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flood_alert_history
    ADD CONSTRAINT flood_alert_history_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node_device(id);


--
-- TOC entry 4964 (class 2606 OID 16811)
-- Name: flood_status flood_status_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flood_status
    ADD CONSTRAINT flood_status_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node_device(id);


--
-- TOC entry 4960 (class 2606 OID 16750)
-- Name: rain_data rain_data_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rain_data
    ADD CONSTRAINT rain_data_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node_device(id);


--
-- TOC entry 4968 (class 2606 OID 16884)
-- Name: sensor_health sensor_health_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_health
    ADD CONSTRAINT sensor_health_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node_device(id);


--
-- TOC entry 4966 (class 2606 OID 16854)
-- Name: system_logs system_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4959 (class 2606 OID 16736)
-- Name: water_level_data water_level_data_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.water_level_data
    ADD CONSTRAINT water_level_data_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node_device(id);


--
-- TOC entry 4961 (class 2606 OID 16764)
-- Name: wind_data wind_data_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wind_data
    ADD CONSTRAINT wind_data_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node_device(id);


-- Completed on 2026-03-13 17:01:03

--
-- PostgreSQL database dump complete
--

\unrestrict QCcoYEvSeLX1PmzTrFL8plCTtzyjLhQyhmbdfyyikneg5C8XEo4smaJFtkJVcbB

