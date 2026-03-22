--
-- PostgreSQL database dump
--

\restrict wiV6CYicfSw0PWjFz4p36HGs7DKZO1vQnVkfPAlE1rrp8is6LAbM5AhZBa2potr

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Bill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bill" (
    id integer NOT NULL,
    "billNumber" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "patientId" integer NOT NULL,
    "subTotal" double precision NOT NULL,
    "discountPercent" double precision,
    "discountAmount" double precision,
    "discountReason" text,
    "netAmount" double precision NOT NULL,
    "paidAmount" double precision NOT NULL,
    "dueAmount" double precision NOT NULL,
    "isFullyPaid" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Bill" OWNER TO postgres;

--
-- Name: BillItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BillItem" (
    id integer NOT NULL,
    "billId" integer NOT NULL,
    "testId" integer NOT NULL,
    price double precision NOT NULL,
    "isUrgent" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."BillItem" OWNER TO postgres;

--
-- Name: BillItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BillItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BillItem_id_seq" OWNER TO postgres;

--
-- Name: BillItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BillItem_id_seq" OWNED BY public."BillItem".id;


--
-- Name: Bill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Bill_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Bill_id_seq" OWNER TO postgres;

--
-- Name: Bill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Bill_id_seq" OWNED BY public."Bill".id;


--
-- Name: Doctor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Doctor" (
    id integer NOT NULL,
    name text NOT NULL,
    code text,
    hospital text
);


ALTER TABLE public."Doctor" OWNER TO postgres;

--
-- Name: Doctor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Doctor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Doctor_id_seq" OWNER TO postgres;

--
-- Name: Doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Doctor_id_seq" OWNED BY public."Doctor".id;


--
-- Name: Patient; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Patient" (
    id integer NOT NULL,
    "patientId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    designation text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    gender text NOT NULL,
    "ageY" integer DEFAULT 0,
    "ageM" integer DEFAULT 0,
    "ageD" integer DEFAULT 0,
    weight text,
    height text,
    phone text NOT NULL,
    email text,
    address text,
    aadhaar text,
    uhid text,
    passport text,
    "referralType" text,
    "refDoctor" text,
    "collectionAt" text
);


ALTER TABLE public."Patient" OWNER TO postgres;

--
-- Name: Patient_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Patient_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Patient_id_seq" OWNER TO postgres;

--
-- Name: Patient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Patient_id_seq" OWNED BY public."Patient".id;


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id integer NOT NULL,
    "billId" integer NOT NULL,
    mode text NOT NULL,
    amount double precision NOT NULL,
    "transactionId" text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: Payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Payment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Payment_id_seq" OWNER TO postgres;

--
-- Name: Payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Payment_id_seq" OWNED BY public."Payment".id;


--
-- Name: Test; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Test" (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    type text DEFAULT 'Test'::text NOT NULL,
    department text,
    "normalRange" text,
    units text
);


ALTER TABLE public."Test" OWNER TO postgres;

--
-- Name: Test_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Test_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Test_id_seq" OWNER TO postgres;

--
-- Name: Test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Test_id_seq" OWNED BY public."Test".id;


--
-- Name: Bill id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bill" ALTER COLUMN id SET DEFAULT nextval('public."Bill_id_seq"'::regclass);


--
-- Name: BillItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BillItem" ALTER COLUMN id SET DEFAULT nextval('public."BillItem_id_seq"'::regclass);


--
-- Name: Doctor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Doctor" ALTER COLUMN id SET DEFAULT nextval('public."Doctor_id_seq"'::regclass);


--
-- Name: Patient id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Patient" ALTER COLUMN id SET DEFAULT nextval('public."Patient_id_seq"'::regclass);


--
-- Name: Payment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment" ALTER COLUMN id SET DEFAULT nextval('public."Payment_id_seq"'::regclass);


--
-- Name: Test id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Test" ALTER COLUMN id SET DEFAULT nextval('public."Test_id_seq"'::regclass);


--
-- Data for Name: Bill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Bill" (id, "billNumber", date, "patientId", "subTotal", "discountPercent", "discountAmount", "discountReason", "netAmount", "paidAmount", "dueAmount", "isFullyPaid") FROM stdin;
1	INV-1769564525804	2026-01-28 01:42:05.804	3	650	0	0	\N	650	650	0	t
2	INV-20260128-7899	2026-01-28 04:29:00	5	350	0	0	\N	350	350	0	t
3	INV-20260128-2072	2026-01-28 04:38:00	1	350	0	0	\N	350	0	350	f
\.


--
-- Data for Name: BillItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BillItem" (id, "billId", "testId", price, "isUrgent") FROM stdin;
1	1	8	650	f
2	2	1	350	f
3	3	1	350	f
\.


--
-- Data for Name: Doctor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Doctor" (id, name, code, hospital) FROM stdin;
\.


--
-- Data for Name: Patient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Patient" (id, "patientId", "createdAt", "updatedAt", designation, "firstName", "lastName", gender, "ageY", "ageM", "ageD", weight, height, phone, email, address, aadhaar, uhid, passport, "referralType", "refDoctor", "collectionAt") FROM stdin;
4	20260128-3933	2026-01-28 01:43:30.548	2026-01-28 01:43:30.548	Mrs.	Laksmi	lv	Female	55	0	0	\N	\N	2266558877	\N	\N	\N	\N	\N	Self	\N	Lab
3	20260128-6457	2026-01-28 01:39:42.723	2026-01-28 02:02:10.036	Mr.	Gautham	Kumar	Male	35	0	0	\N	\N	9955668877			\N	\N	\N	Self	\N	Lab
5	20260128-1036	2026-01-28 04:29:18.928	2026-01-28 04:29:18.928	Mr.	Lalith	Kumar	Male	31	0	0	\N	\N	906395585	\N	\N	\N	\N	\N	Self	\N	\N
2	20260128-8755	2026-01-28 00:56:13.556	2026-01-28 04:33:17.064	Mr.	Lalith	Kumar	Male	31	0	0	\N	\N	963950585			\N	\N	\N	Self	\N	Lab
1	20260128-8499	2026-01-28 00:51:31.835	2026-01-28 04:38:53.091	Mr.	Lalith	Kumar	Male	31	0	0	\N	\N	9063950585			\N	\N	\N	Self	\N	Lab
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "billId", mode, amount, "transactionId", date) FROM stdin;
1	1	Cash	650	\N	2026-01-28 01:42:05.806
2	2	Cash	350	\N	2026-01-28 04:29:32.897
3	3	Cash	0	\N	2026-01-28 04:39:04.369
\.


--
-- Data for Name: Test; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Test" (id, code, name, price, type, department, "normalRange", units) FROM stdin;
1	HEM001	Complete Blood Count (CBC)	350	Test	Hematology	\N	\N
2	HEM002	Hemoglobin (Hb)	100	Test	Hematology	\N	\N
3	HEM003	Blood Group & Rh Type	150	Test	Hematology	\N	\N
4	HEM004	ESR (Erythrocyte Sedimentation Rate)	80	Test	Hematology	\N	\N
5	BIO001	Fasting Blood Sugar (FBS)	80	Test	Biochemistry	\N	\N
6	BIO002	Post Prandial Blood Sugar (PPBS)	80	Test	Biochemistry	\N	\N
7	BIO003	HbA1c (Glycosylated Hemoglobin)	450	Test	Biochemistry	\N	\N
8	BIO004	Lipid Profile	650	Test	Biochemistry	\N	\N
9	BIO005	Liver Function Test (LFT)	700	Test	Biochemistry	\N	\N
10	BIO006	Kidney Function Test (KFT)	700	Test	Biochemistry	\N	\N
11	BIO007	Uric Acid	200	Test	Biochemistry	\N	\N
12	HOR001	Thyroid Profile (T3, T4, TSH)	550	Test	Immunology	\N	\N
13	HOR002	TSH (Thyroid Stimulating Hormone)	250	Test	Immunology	\N	\N
14	VIT001	Vitamin D (25-OH)	1200	Test	Immunology	\N	\N
15	VIT002	Vitamin B12	900	Test	Immunology	\N	\N
16	CP001	Urine Routine & Microscopy	120	Test	Clinical Pathology	\N	\N
17	CP002	Stool Routine	120	Test	Clinical Pathology	\N	\N
18	PKG001	Full Body Checkup (Basic)	1500	Package	Wellness	\N	\N
19	PKG002	Diabetes Care Package	999	Package	Wellness	\N	\N
\.


--
-- Name: BillItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BillItem_id_seq"', 3, true);


--
-- Name: Bill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Bill_id_seq"', 3, true);


--
-- Name: Doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Doctor_id_seq"', 1, false);


--
-- Name: Patient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Patient_id_seq"', 5, true);


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 3, true);


--
-- Name: Test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Test_id_seq"', 19, true);


--
-- Name: BillItem BillItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_pkey" PRIMARY KEY (id);


--
-- Name: Bill Bill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_pkey" PRIMARY KEY (id);


--
-- Name: Doctor Doctor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Doctor"
    ADD CONSTRAINT "Doctor_pkey" PRIMARY KEY (id);


--
-- Name: Patient Patient_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Test Test_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Test"
    ADD CONSTRAINT "Test_pkey" PRIMARY KEY (id);


--
-- Name: Bill_billNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Bill_billNumber_key" ON public."Bill" USING btree ("billNumber");


--
-- Name: Patient_patientId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Patient_patientId_key" ON public."Patient" USING btree ("patientId");


--
-- Name: Test_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Test_code_key" ON public."Test" USING btree (code);


--
-- Name: BillItem BillItem_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES public."Bill"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BillItem BillItem_testId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_testId_fkey" FOREIGN KEY ("testId") REFERENCES public."Test"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Bill Bill_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES public."Bill"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict wiV6CYicfSw0PWjFz4p36HGs7DKZO1vQnVkfPAlE1rrp8is6LAbM5AhZBa2potr

