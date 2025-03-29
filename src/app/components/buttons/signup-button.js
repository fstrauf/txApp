export const SignupButton = () => {
  return (
    <a
      className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow"
      href="/auth/signup?callbackUrl=/fuck-you-money-sheet"
    >
      Sign Up
    </a>
  );
};
