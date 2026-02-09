import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header />
      <EmptyState />
    </Layout>
  );
};

export default Index;
