import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Upload, Calculator, BarChart3, Shield } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Upload,
      title: 'OCR Marksheet Scan',
      description: 'Upload marksheet images and automatically extract grades using AI-powered OCR',
    },
    {
      icon: Calculator,
      title: 'GPA Calculator',
      description: 'Calculate semester GPA using Anna University\'s 10-point grading system',
    },
    {
      icon: BarChart3,
      title: 'CGPA Tracker',
      description: 'Track your cumulative GPA across all semesters with automatic aggregation',
    },
    {
      icon: Shield,
      title: 'Secure Storage',
      description: 'Your academic records are encrypted and stored securely in the cloud',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-hero min-h-[80vh] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-gold p-3 rounded-2xl">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <span className="text-primary-foreground/60 text-sm font-medium tracking-wider uppercase">
                  Anna University Students
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-display font-bold text-primary-foreground leading-tight">
                AU Grade<span className="text-gradient-gold">Pro</span>
              </h1>

              <p className="text-xl text-primary-foreground/60 mt-6 max-w-lg leading-relaxed font-body">
                Your intelligent academic companion. Upload marksheets, auto-extract grades,
                and track your GPA & CGPA effortlessly.
              </p>

              <div className="flex flex-wrap gap-4 mt-10">
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-gold text-secondary-foreground hover:opacity-90 font-semibold px-8"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Sign In
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-display font-bold">Everything you need</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Built specifically for Anna University students with the official grading system
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-card shadow-card hover:shadow-elevated transition-shadow border border-border/50"
              >
                <div className="bg-gradient-primary p-3 rounded-xl w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>AU GradePro — Built for Anna University Students</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
