// Import the new client component wrapper
import LunchMoneySettingsClientPage from './LunchMoneySettingsClientPage';
import SettingsQueryProvider from './SettingsQueryProvider'; // Import the provider

export default function LunchMoneySettingsPage() {
  // Wrap the client component with the query provider
  return (
    <SettingsQueryProvider>
      <LunchMoneySettingsClientPage />
    </SettingsQueryProvider>
  );
} 