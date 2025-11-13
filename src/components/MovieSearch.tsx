import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface MovieSearchProps {
  onClose: () => void;
}

const MovieSearch = ({ onClose }: MovieSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const analyzeMovie = async (title: string, text: string, year?: number, tmdbId?: number, posterPath?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call edge function for AI analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-bechdel', {
        body: {
          movieTitle: title,
          scriptText: text,
          movieYear: year
        }
      });

      if (analysisError) throw analysisError;

      // Save to database
      const { data, error } = await supabase
        .from("movie_analyses")
        .insert({
          user_id: user.id,
          movie_title: title,
          movie_year: year,
          tmdb_id: tmdbId,
          poster_path: posterPath,
          script_text: text,
          bechdel_result: analysisData.result,
          explanation: analysisData.explanation
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Analysis Complete!",
        description: `${title} ${analysisData.result === "Pass" ? "passes" : "fails"} the Bechdel Test.`,
      });

      navigate(`/analysis/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze movie",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScriptUpload = async () => {
    if (!movieTitle.trim() || !scriptText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both movie title and script text",
        variant: "destructive",
      });
      return;
    }

    await analyzeMovie(movieTitle, scriptText);
  };

  const handleMovieSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Note: TMDb API key needs to be added by user
      // For now, we'll show a message
      toast({
        title: "TMDb Integration",
        description: "To use movie search, please add your TMDb API key in the settings.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="script" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search">Search Movie</TabsTrigger>
        <TabsTrigger value="script">Upload Script</TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleMovieSearch()}
          />
          <Button onClick={handleMovieSearch} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Search movies from TMDb database (API key required)
        </p>
      </TabsContent>

      <TabsContent value="script" className="space-y-4">
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Movie title"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
            />
          </div>
          <div>
            <Textarea
              placeholder="Paste movie script or summary here..."
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={10}
              className="resize-none"
            />
          </div>
          <Button onClick={handleScriptUpload} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Analyze Script
              </>
            )}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default MovieSearch;
