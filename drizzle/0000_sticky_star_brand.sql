CREATE TYPE "public"."monitor_check_overall" AS ENUM('healthy', 'degraded', 'unreachable');--> statement-breakpoint
CREATE TYPE "public"."monitor_check_source" AS ENUM('scheduled', 'manual');--> statement-breakpoint
CREATE TYPE "public"."monitor_response_mode" AS ENUM('dashboard', 'email', 'omnidim');--> statement-breakpoint
CREATE TYPE "public"."monitor_status" AS ENUM('healthy', 'unhealthy', 'unreachable', 'degraded');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "monitor_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"monitorConfigurationId" integer NOT NULL,
	"checkedAt" timestamp DEFAULT now() NOT NULL,
	"source" "monitor_check_source" DEFAULT 'scheduled' NOT NULL,
	"overall" "monitor_check_overall" NOT NULL,
	"applicationOk" integer NOT NULL,
	"applicationStatusCode" integer,
	"applicationLatencyMs" integer,
	"applicationDetail" text,
	"healthOk" integer,
	"healthStatusCode" integer,
	"healthLatencyMs" integer,
	"healthDetail" text,
	"incidentId" varchar(32)
);
--> statement-breakpoint
CREATE TABLE "monitor_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"applicationUrl" text NOT NULL,
	"healthUrl" text,
	"cronTaskUid" varchar(65),
	"cronExpression" varchar(64) DEFAULT '0 * * * * *' NOT NULL,
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"runbookMarkdown" text NOT NULL,
	"responseMode" "monitor_response_mode" DEFAULT 'dashboard' NOT NULL,
	"responseContact" varchar(320),
	"failureThreshold" integer DEFAULT 2 NOT NULL,
	"approvedAction" varchar(180) DEFAULT 'Review the incident and restore the service after approval.' NOT NULL,
	"enabled" integer DEFAULT 1 NOT NULL,
	"lastCheckedAt" timestamp,
	"lastStatus" "monitor_status",
	"lastResult" text,
	"consecutiveFailures" integer DEFAULT 0 NOT NULL,
	"activeIncidentId" varchar(32),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE INDEX "monitor_checks_config_idx" ON "monitor_checks" USING btree ("monitorConfigurationId","checkedAt");--> statement-breakpoint
CREATE INDEX "monitor_configurations_user_idx" ON "monitor_configurations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "monitor_configurations_cron_idx" ON "monitor_configurations" USING btree ("cronTaskUid");