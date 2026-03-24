<?php
/**
 * Plugin Name: Agentic WP CLI
 * Plugin URI:  https://github.com/savethepolarbears/agenthaus-marketplace
 * Description: Secure WP-CLI and fleet bridge for agentic maintenance workflows.
 * Version:     1.0.0
 * Author:      AgentHaus Team
 * License:     GPL-2.0-or-later
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Agentic_WP_CLI_Plugin' ) ) {

	final class Agentic_WP_CLI_Plugin {

		const VERSION        = '1.0.0';
		const OPTION_KEY     = 'agentic_wp_cli_settings';
		const LOG_OPTION_KEY = 'agentic_wp_cli_logs';
		const REST_NAMESPACE = 'agentic-wp-cli/v1';
		const MAX_LOG_ENTRIES = 200;

		/** @var self|null */
		private static $instance = null;

		/** @var array<string,mixed> */
		private $settings = array();

		public static function instance(): self {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		private function __construct() {
			$this->settings = $this->get_settings();

			add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
			add_action( 'admin_init', array( $this, 'register_settings' ) );
			add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
			add_action( 'plugins_loaded', array( $this, 'register_cli_command' ) );
		}

		/* ------------------------------------------------------------------
		 * Activation / Deactivation
		 * ----------------------------------------------------------------*/

		public static function activate(): void {
			$defaults = self::default_settings();
			$current  = get_option( self::OPTION_KEY, array() );
			if ( ! is_array( $current ) ) {
				$current = array();
			}
			update_option( self::OPTION_KEY, wp_parse_args( $current, $defaults ) );

			if ( false === get_option( self::LOG_OPTION_KEY, false ) ) {
				add_option( self::LOG_OPTION_KEY, array(), '', false );
			}
		}

		public static function deactivate(): void {
			// Keep settings and logs for auditability.
		}

		/* ------------------------------------------------------------------
		 * Settings
		 * ----------------------------------------------------------------*/

		/**
		 * @return array<string,mixed>
		 */
		public static function default_settings(): array {
			return array(
				'enabled'            => 1,
				'read_only_mode'     => 1,
				'site_label'         => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
				'environment'        => 'production',
				'wp_cli_binary'      => 'wp',
				'default_ssh_target' => '',
				'default_wp_path'    => untrailingslashit( ABSPATH ),
				'default_http_target'=> home_url( '/' ),
				'shared_secret'      => wp_generate_password( 48, false, false ),
				'allowed_mutations'  => array( 'plugin_update', 'theme_update', 'cache_flush', 'rewrite_flush' ),
			);
		}

		/**
		 * @return array<string,mixed>
		 */
		public function get_settings(): array {
			$settings = get_option( self::OPTION_KEY, array() );
			if ( ! is_array( $settings ) ) {
				$settings = array();
			}
			$settings = wp_parse_args( $settings, self::default_settings() );

			if ( ! is_array( $settings['allowed_mutations'] ) ) {
				$settings['allowed_mutations'] = self::default_settings()['allowed_mutations'];
			}
			return $settings;
		}

		public function register_settings(): void {
			register_setting( 'agentic_wp_cli', self::OPTION_KEY, array( $this, 'sanitize_settings' ) );
		}

		/**
		 * @param mixed $input
		 * @return array<string,mixed>
		 */
		public function sanitize_settings( $input ): array {
			$defaults = self::default_settings();
			$input    = is_array( $input ) ? $input : array();

			$allowed_mutations = array();
			if ( isset( $input['allowed_mutations'] ) && is_array( $input['allowed_mutations'] ) ) {
				$catalog = array_keys( $this->get_operation_catalog() );
				foreach ( $input['allowed_mutations'] as $mutation ) {
					$mutation = sanitize_key( $mutation );
					if ( in_array( $mutation, $catalog, true ) && $this->operation_is_mutating( $mutation ) ) {
						$allowed_mutations[] = $mutation;
					}
				}
			}

			$secret = isset( $input['shared_secret'] ) ? trim( (string) $input['shared_secret'] ) : '';
			if ( '' === $secret ) {
				$secret = $defaults['shared_secret'];
			}

			return array(
				'enabled'            => ! empty( $input['enabled'] ) ? 1 : 0,
				'read_only_mode'     => ! empty( $input['read_only_mode'] ) ? 1 : 0,
				'site_label'         => isset( $input['site_label'] ) ? sanitize_text_field( (string) $input['site_label'] ) : $defaults['site_label'],
				'environment'        => in_array( (string) ( $input['environment'] ?? '' ), array( 'production', 'staging', 'development', 'local' ), true ) ? (string) $input['environment'] : $defaults['environment'],
				'wp_cli_binary'      => isset( $input['wp_cli_binary'] ) ? sanitize_text_field( (string) $input['wp_cli_binary'] ) : $defaults['wp_cli_binary'],
				'default_ssh_target' => isset( $input['default_ssh_target'] ) ? sanitize_text_field( (string) $input['default_ssh_target'] ) : '',
				'default_wp_path'    => isset( $input['default_wp_path'] ) ? sanitize_text_field( (string) $input['default_wp_path'] ) : $defaults['default_wp_path'],
				'default_http_target'=> isset( $input['default_http_target'] ) ? esc_url_raw( (string) $input['default_http_target'] ) : $defaults['default_http_target'],
				'shared_secret'      => preg_replace( '/\s+/', '', $secret ),
				'allowed_mutations'  => array_values( array_unique( $allowed_mutations ) ),
			);
		}

		/* ------------------------------------------------------------------
		 * Operation Catalog
		 * ----------------------------------------------------------------*/

		/**
		 * @return array<string,array{description:string,mutating:bool}>
		 */
		public function get_operation_catalog(): array {
			return array(
				'health'         => array( 'description' => 'Site health check',            'mutating' => false ),
				'inventory'      => array( 'description' => 'Plugin and theme inventory',    'mutating' => false ),
				'manifest'       => array( 'description' => 'Site manifest for fleet',       'mutating' => false ),
				'plugin_update'  => array( 'description' => 'Update plugins',                'mutating' => true  ),
				'theme_update'   => array( 'description' => 'Update themes',                 'mutating' => true  ),
				'cache_flush'    => array( 'description' => 'Flush object cache',            'mutating' => true  ),
				'rewrite_flush'  => array( 'description' => 'Flush rewrite rules',           'mutating' => true  ),
			);
		}

		public function operation_is_mutating( string $operation ): bool {
			$catalog = $this->get_operation_catalog();
			return isset( $catalog[ $operation ] ) && ! empty( $catalog[ $operation ]['mutating'] );
		}

		/* ------------------------------------------------------------------
		 * Admin Menu
		 * ----------------------------------------------------------------*/

		public function register_admin_menu(): void {
			add_management_page(
				'Agentic WP CLI',
				'Agentic WP CLI',
				'manage_options',
				'agentic-wp-cli',
				array( $this, 'render_settings_page' )
			);
		}

		public function render_settings_page(): void {
			if ( ! current_user_can( 'manage_options' ) ) {
				return;
			}

			$settings = $this->get_settings();
			$catalog  = $this->get_operation_catalog();
			$logs     = $this->get_logs();
			?>
			<div class="wrap">
				<h1>Agentic WP CLI</h1>
				<p>Secure bridge for agentic workflows that need WordPress inventory, update checks, and tightly-scoped maintenance operations.</p>

				<form method="post" action="options.php">
					<?php settings_fields( 'agentic_wp_cli' ); ?>
					<table class="form-table" role="presentation">
						<tr>
							<th scope="row">Enable bridge</th>
							<td><label><input type="checkbox" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[enabled]" value="1" <?php checked( ! empty( $settings['enabled'] ) ); ?>> Allow REST and CLI access through this plugin</label></td>
						</tr>
						<tr>
							<th scope="row">Read-only mode</th>
							<td><label><input type="checkbox" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[read_only_mode]" value="1" <?php checked( ! empty( $settings['read_only_mode'] ) ); ?>> Block mutating REST operations</label></td>
						</tr>
						<tr>
							<th scope="row"><label for="agentic-site-label">Site label</label></th>
							<td><input id="agentic-site-label" type="text" class="regular-text" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[site_label]" value="<?php echo esc_attr( (string) $settings['site_label'] ); ?>"></td>
						</tr>
						<tr>
							<th scope="row"><label for="agentic-environment">Environment</label></th>
							<td>
								<select id="agentic-environment" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[environment]">
									<?php foreach ( array( 'production', 'staging', 'development', 'local' ) as $env ) : ?>
										<option value="<?php echo esc_attr( $env ); ?>" <?php selected( $settings['environment'], $env ); ?>><?php echo esc_html( ucfirst( $env ) ); ?></option>
									<?php endforeach; ?>
								</select>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="agentic-binary">WP-CLI binary</label></th>
							<td>
								<input id="agentic-binary" aria-describedby="agentic-binary-desc" type="text" class="regular-text" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[wp_cli_binary]" value="<?php echo esc_attr( (string) $settings['wp_cli_binary'] ); ?>">
								<p id="agentic-binary-desc" class="description">Usually <code style="user-select: all;">wp</code> or a full path like <code style="user-select: all;">/usr/local/bin/wp</code>.</p>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="agentic-ssh">Default SSH target</label></th>
							<td>
								<input id="agentic-ssh" aria-describedby="agentic-ssh-desc" type="text" class="regular-text" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[default_ssh_target]" value="<?php echo esc_attr( (string) $settings['default_ssh_target'] ); ?>">
								<p id="agentic-ssh-desc" class="description">Example: <code style="user-select: all;">deploy@example.com</code></p>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="agentic-path">Default WordPress path</label></th>
							<td><input id="agentic-path" type="text" class="regular-text code" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[default_wp_path]" value="<?php echo esc_attr( (string) $settings['default_wp_path'] ); ?>"></td>
						</tr>
						<tr>
							<th scope="row"><label for="agentic-http">Default HTTP target</label></th>
							<td><input id="agentic-http" type="url" class="regular-text code" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[default_http_target]" value="<?php echo esc_attr( (string) $settings['default_http_target'] ); ?>"></td>
						</tr>
						<tr>
							<th scope="row"><label for="agentic-secret">Shared secret</label></th>
							<td>
								<input id="agentic-secret" aria-describedby="agentic-secret-desc" type="text" class="large-text code" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[shared_secret]" value="<?php echo esc_attr( (string) $settings['shared_secret'] ); ?>">
								<p id="agentic-secret-desc" class="description">Send this value as <code style="user-select: all;">X-Agentic-WP-Secret</code> with REST requests.</p>
							</td>
						</tr>
						<tr>
							<th scope="row">Allowed mutating operations</th>
							<td>
								<fieldset>
									<legend class="screen-reader-text"><span>Allowed mutating operations</span></legend>
									<?php foreach ( $catalog as $key => $spec ) : ?>
										<?php if ( empty( $spec['mutating'] ) ) { continue; } ?>
										<label style="display:block;margin-bottom:6px;">
											<input type="checkbox" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[allowed_mutations][]" value="<?php echo esc_attr( $key ); ?>" <?php checked( in_array( $key, $settings['allowed_mutations'], true ) ); ?>>
											<code style="user-select: all;"><?php echo esc_html( $key ); ?></code> &mdash; <?php echo esc_html( (string) $spec['description'] ); ?>
										</label>
									<?php endforeach; ?>
								</fieldset>
							</td>
						</tr>
					</table>
					<?php submit_button(); ?>
				</form>

				<hr>
				<h2>Recent Activity Log</h2>
				<?php if ( empty( $logs ) ) : ?>
					<p>No activity recorded yet.</p>
				<?php else : ?>
					<table class="widefat striped">
						<thead>
							<tr>
								<th scope="col">Time</th>
								<th scope="col">Operation</th>
								<th scope="col">Source</th>
								<th scope="col">Status</th>
							</tr>
						</thead>
						<tbody>
							<?php foreach ( array_reverse( array_slice( $logs, -20 ) ) as $log ) : ?>
								<tr>
									<td><?php echo esc_html( $log['time'] ?? '' ); ?></td>
									<td><code style="user-select: all;"><?php echo esc_html( $log['operation'] ?? '' ); ?></code></td>
									<td><?php echo esc_html( $log['source'] ?? '' ); ?></td>
									<td><?php echo esc_html( $log['status'] ?? '' ); ?></td>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				<?php endif; ?>
			</div>
			<?php
		}

		/* ------------------------------------------------------------------
		 * REST API
		 * ----------------------------------------------------------------*/

		public function register_rest_routes(): void {
			register_rest_route( self::REST_NAMESPACE, '/health', array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'rest_health' ),
				'permission_callback' => array( $this, 'rest_permission_check' ),
			) );

			register_rest_route( self::REST_NAMESPACE, '/inventory', array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'rest_inventory' ),
				'permission_callback' => array( $this, 'rest_permission_check' ),
			) );

			register_rest_route( self::REST_NAMESPACE, '/manifest', array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'rest_manifest' ),
				'permission_callback' => array( $this, 'rest_permission_check' ),
			) );

			register_rest_route( self::REST_NAMESPACE, '/run', array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'rest_run' ),
				'permission_callback' => array( $this, 'rest_permission_check' ),
			) );
		}

		public function rest_permission_check( \WP_REST_Request $request ): bool {
			$settings = $this->get_settings();

			if ( empty( $settings['enabled'] ) ) {
				return false;
			}

			// Require authenticated user with manage_options capability.
			if ( ! current_user_can( 'manage_options' ) ) {
				return false;
			}

			// Require shared secret header.
			$provided = $request->get_header( 'X-Agentic-WP-Secret' );
			if ( empty( $provided ) || ! hash_equals( $settings['shared_secret'], $provided ) ) {
				return false;
			}

			return true;
		}

		public function rest_health( \WP_REST_Request $request ): \WP_REST_Response {
			$this->log_operation( 'health', 'rest' );
			return new \WP_REST_Response( $this->get_health_payload(), 200 );
		}

		public function rest_inventory( \WP_REST_Request $request ): \WP_REST_Response {
			$this->log_operation( 'inventory', 'rest' );
			return new \WP_REST_Response( $this->get_inventory_payload(), 200 );
		}

		public function rest_manifest( \WP_REST_Request $request ): \WP_REST_Response {
			$this->log_operation( 'manifest', 'rest' );
			return new \WP_REST_Response( $this->get_manifest_payload(), 200 );
		}

		public function rest_run( \WP_REST_Request $request ): \WP_REST_Response {
			$settings = $this->get_settings();

			$operation = sanitize_key( $request->get_param( 'operation' ) ?? '' );
			$args      = $request->get_param( 'args' );
			if ( ! is_array( $args ) ) {
				$args = array();
			}

			// Validate operation exists.
			$catalog = $this->get_operation_catalog();
			if ( ! isset( $catalog[ $operation ] ) ) {
				return new \WP_REST_Response( array(
					'error' => 'Unknown operation.',
					'valid' => array_keys( $catalog ),
				), 400 );
			}

			// Block mutating operations in read-only mode.
			if ( $this->operation_is_mutating( $operation ) ) {
				if ( ! empty( $settings['read_only_mode'] ) ) {
					return new \WP_REST_Response( array(
						'error' => 'Read-only mode is enabled. Mutating operations are blocked.',
					), 403 );
				}
				if ( ! in_array( $operation, $settings['allowed_mutations'], true ) ) {
					return new \WP_REST_Response( array(
						'error' => "Operation '{$operation}' is not in the allowed mutations list.",
					), 403 );
				}
			}

			$result = $this->execute_operation( $operation, $args );
			$status = $result['success'] ? 'success' : 'error';
			$this->log_operation( $operation, 'rest', $status );

			return new \WP_REST_Response( $result, $result['success'] ? 200 : 500 );
		}

		/* ------------------------------------------------------------------
		 * Operation Execution
		 * ----------------------------------------------------------------*/

		/**
		 * @param string $operation
		 * @param array  $args
		 * @return array
		 */
		private function execute_operation( string $operation, array $args ): array {
			switch ( $operation ) {
				case 'health':
					return array( 'success' => true, 'data' => $this->get_health_payload() );
				case 'inventory':
					return array( 'success' => true, 'data' => $this->get_inventory_payload() );
				case 'manifest':
					return array( 'success' => true, 'data' => $this->get_manifest_payload() );
				case 'plugin_update':
					return $this->execute_plugin_update( $args );
				case 'theme_update':
					return $this->execute_theme_update( $args );
				case 'cache_flush':
					return $this->execute_cache_flush();
				case 'rewrite_flush':
					return $this->execute_rewrite_flush();
				default:
					return array( 'success' => false, 'error' => 'Operation not implemented.' );
			}
		}

		private function execute_plugin_update( array $args ): array {
			$dry_run = ! empty( $args['dry_run'] );
			$all     = ! empty( $args['all'] );

			if ( ! function_exists( 'get_plugins' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}

			$update_plugins = get_site_transient( 'update_plugins' );
			if ( empty( $update_plugins->response ) ) {
				return array( 'success' => true, 'data' => array(), 'message' => 'All plugins are up to date.' );
			}

			$updates = array();
			foreach ( $update_plugins->response as $file => $info ) {
				$updates[] = array(
					'plugin'      => $file,
					'slug'        => $info->slug ?? '',
					'new_version' => $info->new_version ?? '',
					'dry_run'     => $dry_run,
				);
			}

			if ( $dry_run ) {
				return array( 'success' => true, 'data' => $updates, 'mode' => 'dry-run' );
			}

			// Execute actual updates (requires wp-admin/includes/class-wp-upgrader.php).
			if ( ! class_exists( 'Plugin_Upgrader' ) ) {
				require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
			}

			$skin     = new \Automatic_Upgrader_Skin();
			$upgrader = new \Plugin_Upgrader( $skin );
			$results  = array();

			foreach ( $update_plugins->response as $file => $info ) {
				$result    = $upgrader->upgrade( $file );
				$results[] = array(
					'plugin'  => $file,
					'slug'    => $info->slug ?? '',
					'success' => ( false !== $result && ! is_wp_error( $result ) ),
				);
			}

			return array( 'success' => true, 'data' => $results, 'mode' => 'execute' );
		}

		private function execute_theme_update( array $args ): array {
			$dry_run = ! empty( $args['dry_run'] );

			$update_themes = get_site_transient( 'update_themes' );
			if ( empty( $update_themes->response ) ) {
				return array( 'success' => true, 'data' => array(), 'message' => 'All themes are up to date.' );
			}

			$updates = array();
			foreach ( $update_themes->response as $slug => $info ) {
				$updates[] = array(
					'theme'       => $slug,
					'new_version' => $info['new_version'] ?? '',
					'dry_run'     => $dry_run,
				);
			}

			if ( $dry_run ) {
				return array( 'success' => true, 'data' => $updates, 'mode' => 'dry-run' );
			}

			if ( ! class_exists( 'Theme_Upgrader' ) ) {
				require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
			}

			$skin     = new \Automatic_Upgrader_Skin();
			$upgrader = new \Theme_Upgrader( $skin );
			$results  = array();

			foreach ( $update_themes->response as $slug => $info ) {
				$result    = $upgrader->upgrade( $slug );
				$results[] = array(
					'theme'   => $slug,
					'success' => ( false !== $result && ! is_wp_error( $result ) ),
				);
			}

			return array( 'success' => true, 'data' => $results, 'mode' => 'execute' );
		}

		private function execute_cache_flush(): array {
			wp_cache_flush();
			return array( 'success' => true, 'message' => 'Object cache flushed.' );
		}

		private function execute_rewrite_flush(): array {
			flush_rewrite_rules();
			return array( 'success' => true, 'message' => 'Rewrite rules flushed.' );
		}

		/* ------------------------------------------------------------------
		 * Data Payloads
		 * ----------------------------------------------------------------*/

		private function get_health_payload(): array {
			global $wp_version;

			return array(
				'plugin_version' => self::VERSION,
				'wp_version'     => $wp_version,
				'php_version'    => PHP_VERSION,
				'site_label'     => $this->settings['site_label'] ?? '',
				'environment'    => $this->settings['environment'] ?? 'production',
				'multisite'      => is_multisite(),
				'read_only_mode' => ! empty( $this->settings['read_only_mode'] ),
				'timestamp'      => gmdate( 'c' ),
			);
		}

		private function get_inventory_payload(): array {
			if ( ! function_exists( 'get_plugins' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}

			$all_plugins    = get_plugins();
			$active_plugins = get_option( 'active_plugins', array() );
			$update_plugins = get_site_transient( 'update_plugins' );

			$plugins = array();
			foreach ( $all_plugins as $file => $data ) {
				$has_update = isset( $update_plugins->response[ $file ] );
				$plugins[]  = array(
					'file'        => $file,
					'name'        => $data['Name'] ?? '',
					'version'     => $data['Version'] ?? '',
					'active'      => in_array( $file, $active_plugins, true ),
					'update'      => $has_update ? ( $update_plugins->response[ $file ]->new_version ?? '' ) : false,
				);
			}

			$themes        = array();
			$all_themes    = wp_get_themes();
			$active_theme  = get_stylesheet();
			$update_themes = get_site_transient( 'update_themes' );

			foreach ( $all_themes as $slug => $theme ) {
				$has_update = isset( $update_themes->response[ $slug ] );
				$themes[]   = array(
					'slug'        => $slug,
					'name'        => $theme->get( 'Name' ),
					'version'     => $theme->get( 'Version' ),
					'active'      => ( $slug === $active_theme ),
					'update'      => $has_update ? ( $update_themes->response[ $slug ]['new_version'] ?? '' ) : false,
				);
			}

			return array(
				'plugins' => $plugins,
				'themes'  => $themes,
			);
		}

		private function get_manifest_payload(): array {
			global $wp_version;

			return array(
				'site_label'  => $this->settings['site_label'] ?? '',
				'environment' => $this->settings['environment'] ?? 'production',
				'url'         => home_url( '/' ),
				'wp_version'  => $wp_version,
				'php_version' => PHP_VERSION,
				'multisite'   => is_multisite(),
				'rest_base'   => rest_url( self::REST_NAMESPACE ),
				'timestamp'   => gmdate( 'c' ),
			);
		}

		/* ------------------------------------------------------------------
		 * WP-CLI Commands
		 * ----------------------------------------------------------------*/

		public function register_cli_command(): void {
			if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
				return;
			}

			\WP_CLI::add_command( 'agentic', array( $this, 'cli_dispatch' ) );
		}

		/**
		 * Agentic WP CLI commands.
		 *
		 * ## EXAMPLES
		 *
		 *     wp agentic health --format=json
		 *     wp agentic inventory --format=json
		 *     wp agentic update-plugins --all --execute
		 *
		 * @param array $args       Positional arguments.
		 * @param array $assoc_args Named arguments.
		 */
		public function cli_dispatch( array $args, array $assoc_args ): void {
			if ( empty( $args[0] ) ) {
				\WP_CLI::error( 'Subcommand required: health, inventory, manifest, update-plugins, update-themes, cache-flush, rewrite-flush' );
				return;
			}

			$subcommand = $args[0];
			$format     = $assoc_args['format'] ?? 'json';

			switch ( $subcommand ) {
				case 'health':
					$data = $this->get_health_payload();
					$this->cli_output( $data, $format );
					$this->log_operation( 'health', 'cli' );
					break;

				case 'inventory':
					$data = $this->get_inventory_payload();
					$this->cli_output( $data, $format );
					$this->log_operation( 'inventory', 'cli' );
					break;

				case 'manifest':
					$data = $this->get_manifest_payload();
					$this->cli_output( $data, $format );
					$this->log_operation( 'manifest', 'cli' );
					break;

				case 'update-plugins':
					$execute = isset( $assoc_args['execute'] );
					$result  = $this->execute_plugin_update( array(
						'all'     => isset( $assoc_args['all'] ),
						'dry_run' => ! $execute,
					) );
					$this->cli_output( $result, $format );
					$this->log_operation( 'plugin_update', 'cli', $result['success'] ? 'success' : 'error' );
					break;

				case 'update-themes':
					$execute = isset( $assoc_args['execute'] );
					$result  = $this->execute_theme_update( array(
						'all'     => isset( $assoc_args['all'] ),
						'dry_run' => ! $execute,
					) );
					$this->cli_output( $result, $format );
					$this->log_operation( 'theme_update', 'cli', $result['success'] ? 'success' : 'error' );
					break;

				case 'cache-flush':
					$result = $this->execute_cache_flush();
					$this->cli_output( $result, $format );
					$this->log_operation( 'cache_flush', 'cli' );
					break;

				case 'rewrite-flush':
					$result = $this->execute_rewrite_flush();
					$this->cli_output( $result, $format );
					$this->log_operation( 'rewrite_flush', 'cli' );
					break;

				default:
					\WP_CLI::error( "Unknown subcommand: {$subcommand}" );
			}
		}

		/**
		 * @param mixed  $data
		 * @param string $format
		 */
		private function cli_output( $data, string $format = 'json' ): void {
			if ( 'json' === $format ) {
				\WP_CLI::log( wp_json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) );
			} else {
				\WP_CLI::log( print_r( $data, true ) );
			}
		}

		/* ------------------------------------------------------------------
		 * Logging
		 * ----------------------------------------------------------------*/

		private function log_operation( string $operation, string $source, string $status = 'success' ): void {
			$logs = $this->get_logs();
			$logs[] = array(
				'time'      => gmdate( 'c' ),
				'operation' => $operation,
				'source'    => $source,
				'status'    => $status,
			);

			// Keep only the most recent entries.
			if ( count( $logs ) > self::MAX_LOG_ENTRIES ) {
				$logs = array_slice( $logs, -self::MAX_LOG_ENTRIES );
			}

			update_option( self::LOG_OPTION_KEY, $logs, false );
		}

		/**
		 * @return array
		 */
		private function get_logs(): array {
			$logs = get_option( self::LOG_OPTION_KEY, array() );
			return is_array( $logs ) ? $logs : array();
		}
	}

	// Initialize.
	add_action( 'plugins_loaded', array( 'Agentic_WP_CLI_Plugin', 'instance' ), 5 );

	register_activation_hook( __FILE__, array( 'Agentic_WP_CLI_Plugin', 'activate' ) );
	register_deactivation_hook( __FILE__, array( 'Agentic_WP_CLI_Plugin', 'deactivate' ) );
}
