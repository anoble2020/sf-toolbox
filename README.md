# sf toolbox
sf toolbox is an open-source Salesforce developer console replacement designed to enhance productivity and streamline development workflows. This project provides a suite of tools and features tailored for Salesforce developers.

![Website Deploy](https://deploy-badge.vercel.app/?url=http://www.nextjs.org/&name=sf-toolbox.com)


## Key Features

- **Dashboard Overview**: Get a comprehensive view of your Salesforce org's API usage, storage, and security metrics. The dashboard provides real-time insights into API requests, bulk API usage, and more.

- **Code Execution**: Execute Apex code directly from the interface. Save, update, and manage code blocks with ease. The execution results are logged for review.

- **File Explorer**: Browse and view Apex classes, triggers, Lightning Web Components, and Aura components. The explorer supports file selection and displays code coverage information.

- **Trace Flags Management**: Manage trace flags to monitor and debug Salesforce processes. Easily create, renew, and delete trace flags.

- **Log Viewer**: Analyze logs with a detailed timeline and event breakdown. The log viewer supports filtering and highlighting key events. It features a "pretty" log viewer that formats logs for better readability, highlighting important keywords and structuring the data for easy analysis. This tool is essential for debugging and understanding complex log files, providing a clear view of the execution flow and system interactions.

- **Authentication**: Securely connect to your Salesforce org using standard or custom domain authentication. The app ensures a seamless connection setup.

## Connecting a Salesforce Org

sf toolbox provides two primary methods for connecting to your Salesforce org: through a Chrome extension or by logging in directly via the application interface.

### Method 1: Using the Chrome Extension

1. **Install the Extension**: First, ensure that the SF Toolbox Chrome extension is installed and enabled in your browser.

2. **Access Salesforce**: Navigate to your Salesforce instance in the Chrome browser.

3. **Activate the Toolbox**: Once on the Salesforce page, the SF Toolbox icon should appear in the global actions list. Click the icon to activate the toolbox features directly within Salesforce.

4. **Authenticate**: The extension will automatically handle authentication using your current Salesforce session, allowing you to access the toolbox features seamlessly.

### Method 2: Direct Login via Application

1. **Navigate to the Auth Page**: Open the SF Toolbox application and navigate to the authentication page.

2. **Choose Domain**: Choose to connect either a sandbox or production org, or optionally input your custom Salesforce domain in the format `my-domain.my.salesforce.com`

3. **Authentication Process**: The application will check for existing authentication tokens. If none are found, it will redirect you to the Salesforce login page to authenticate.


For more details on the authentication process, refer to the following code block:

## Contributing

Contributions are welcome! Please read the `CONTRIBUTING.md` file for guidelines on how to contribute to this project.

## License

This project is licensed under the GNU General Public License v3.0. See the `LICENSE` file for more details.