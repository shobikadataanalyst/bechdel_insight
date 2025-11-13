import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

interface Analysis {
  id: string;
  movie_title: string;
  movie_year: number | null;
  bechdel_result: string;
  created_at: string;
  poster_path: string | null;
}

interface AnalysisListProps {
  userId: string;
}

const AnalysisList = ({ userId }: AnalysisListProps) => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalyses();
  }, [userId]);

  const loadAnalyses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("movie_analyses")
      .select("id, movie_title, movie_year, bechdel_result, created_at, poster_path")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading analyses:", error);
    } else {
      setAnalyses(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading analyses...</div>;
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No analyses yet. Start by analyzing your first movie!
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">Recent Analyses</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {analyses.map((analysis) => (
          <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{analysis.movie_title}</CardTitle>
                  {analysis.movie_year && (
                    <CardDescription>{analysis.movie_year}</CardDescription>
                  )}
                </div>
                <Badge
                  variant={analysis.bechdel_result?.toLowerCase() === "pass" ? "default" : "destructive"}
                >
                  {analysis.bechdel_result}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/analysis/${analysis.id}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnalysisList;
