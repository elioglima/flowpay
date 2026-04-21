export default function DashboardFooter() {
  return (
    <footer className="appFooter">
      <p className="appFooterLine">
        <span className="appFooterName">elio.lima</span>
        <span className="appFooterSep">·</span>
        <a className="appFooterLink" href="mailto:elio.designer@hotmail.com">
          elio.designer@hotmail.com
        </a>
      </p>
      <p className="appFooterUpdated">
        Atualizado em{" "}
        {new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </p>
    </footer>
  );
}
