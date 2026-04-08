import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--bg))] p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="font-heading text-[120px] sm:text-[160px] font-bold leading-none text-primary tracking-wider">
          404
        </h1>
        <p className="font-heading text-2xl font-bold text-foreground tracking-wider">
          Essa arena não existe
        </p>
        <p className="text-sm text-muted-foreground font-body">
          A página que você procura foi eliminada ou nunca existiu.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-heading font-bold tracking-wider text-sm hover:bg-primary/90 transition-colors mt-4"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
