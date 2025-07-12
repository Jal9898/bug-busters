import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, ArrowRight, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
            Skill Swap Platform
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Connect with like-minded professionals and exchange skills to grow together. 
            Learn something new while teaching what you know best.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 text-lg"
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-teal-400 mx-auto mb-4" />
              <CardTitle className="text-slate-100">Connect & Learn</CardTitle>
              <CardDescription className="text-slate-300">
                Find skilled professionals in your area and connect with them for skill exchanges
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center">
              <Star className="h-12 w-12 text-teal-400 mx-auto mb-4" />
              <CardTitle className="text-slate-100">Rate & Review</CardTitle>
              <CardDescription className="text-slate-300">
                Build trust in the community with our rating and feedback system
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-teal-400 mx-auto mb-4" />
              <CardTitle className="text-slate-100">Safe & Secure</CardTitle>
              <CardDescription className="text-slate-300">
                Verified profiles and moderated platform ensure a safe learning environment
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-12 text-slate-100">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Create Profile</h3>
              <p className="text-slate-300">List your skills and what you'd like to learn</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Browse & Connect</h3>
              <p className="text-slate-300">Find others with complementary skills</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Make Requests</h3>
              <p className="text-slate-300">Send skill swap requests to potential partners</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Learn & Teach</h3>
              <p className="text-slate-300">Exchange skills and rate your experience</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4 text-slate-100">Ready to Start Learning?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of professionals already exchanging skills and growing together
            </p>
            <Button 
              onClick={handleLogin} 
              size="lg" 
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 text-lg"
            >
              Join the Community <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
