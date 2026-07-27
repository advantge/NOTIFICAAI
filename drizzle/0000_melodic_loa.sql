CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`actor_user_id` text,
	`actor_type` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text,
	`ip_address_masked` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_store_created_idx` ON `audit_logs` (`store_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`scope` text NOT NULL,
	`key_hash` text NOT NULL,
	`response` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idempotency_store_scope_key_unique` ON `idempotency_keys` (`store_id`,`scope`,`key_hash`);--> statement-breakpoint
CREATE TABLE `integration_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`provider` text NOT NULL,
	`environment` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`webhook_status` text DEFAULT 'NOT_CONFIGURED' NOT NULL,
	`last_successful_request_at` integer,
	`last_successful_webhook_at` integer,
	`last_error_at` integer,
	`last_error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integration_store_provider_env_unique` ON `integration_settings` (`store_id`,`provider`,`environment`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sale_id` text,
	`payment_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`read_at` integer,
	`delivered_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`event_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`delivered_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `outbox_status_created_idx` ON `outbox_events` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `payment_verification_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`outcome` text NOT NULL,
	`reasons` text,
	`provider_status` text,
	`latency_ms` integer,
	`error_message` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `verification_payment_created_idx` ON `payment_verification_attempts` (`payment_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`sale_id` text NOT NULL,
	`provider` text NOT NULL,
	`environment` text NOT NULL,
	`provider_order_id` text NOT NULL,
	`provider_charge_id` text,
	`provider_qr_code_id` text,
	`provider_notification_id` text,
	`end_to_end_id` text,
	`reference_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`status` text NOT NULL,
	`payer_name` text,
	`payer_document_masked` text,
	`pix_copy_paste_encrypted` text,
	`qr_code_image_url` text,
	`expires_at` integer,
	`paid_at` integer,
	`verified_at` integer,
	`verification_method` text,
	`verification_attempts` integer DEFAULT 0 NOT NULL,
	`last_verification_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_order_unique` ON `payments` (`environment`,`provider`,`provider_order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_charge_unique` ON `payments` (`environment`,`provider`,`provider_charge_id`);--> statement-breakpoint
CREATE INDEX `payments_store_status_idx` ON `payments` (`store_id`,`status`);--> statement-breakpoint
CREATE TABLE `reconciliation_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`sale_id` text,
	`payment_id` text,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`confidence_score` integer,
	`assigned_to` text,
	`resolution` text,
	`resolved_by` text,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reconciliation_store_status_idx` ON `reconciliation_cases` (`store_id`,`status`);--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`seller_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text,
	`customer_document_masked` text,
	`description` text NOT NULL,
	`internal_reference` text NOT NULL,
	`original_amount` integer NOT NULL,
	`final_amount` integer NOT NULL,
	`unique_cents` integer,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`expires_at` integer,
	`paid_at` integer,
	`canceled_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_store_reference_unique` ON `sales` (`store_id`,`internal_reference`);--> statement-breakpoint
CREATE INDEX `sales_store_status_created_idx` ON `sales` (`store_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `sales_seller_status_idx` ON `sales` (`seller_id`,`status`);--> statement-breakpoint
CREATE TABLE `seller_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`seller_code` text NOT NULL,
	`commission_rate_bps` integer DEFAULT 0 NOT NULL,
	`notification_preferences` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seller_profiles_user_id_unique` ON `seller_profiles` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `seller_profiles_seller_code_unique` ON `seller_profiles` (`seller_code`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`ip_address_masked` text,
	`user_agent_hash` text,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_expires_idx` ON `sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`document_masked` text,
	`timezone` text DEFAULT 'America/Fortaleza' NOT NULL,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`environment` text DEFAULT 'DEMO' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`avatar_url` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`password_hash` text,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_store_email_unique` ON `users` (`store_id`,`email`);--> statement-breakpoint
CREATE INDEX `users_store_role_idx` ON `users` (`store_id`,`role`);--> statement-breakpoint
CREATE TABLE `payment_webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`environment` text NOT NULL,
	`provider_event_id` text,
	`event_type` text NOT NULL,
	`payload_hash` text NOT NULL,
	`sanitized_payload` text NOT NULL,
	`processing_status` text NOT NULL,
	`received_at` integer NOT NULL,
	`processed_at` integer,
	`error_message` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_payload_unique` ON `payment_webhook_events` (`provider`,`environment`,`payload_hash`);--> statement-breakpoint
CREATE TABLE `webhook_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`webhook_event_id` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer,
	`last_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`webhook_event_id`) REFERENCES `payment_webhook_events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `webhook_jobs_status_next_idx` ON `webhook_jobs` (`status`,`next_attempt_at`);