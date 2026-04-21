type ErrorBannerProps = {
  message: string;
};

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <section className="panel errorPanel pageBlock">
      <p className="errorText">{message}</p>
    </section>
  );
}
