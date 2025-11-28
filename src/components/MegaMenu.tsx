import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { educationCategories, popularSubjects } from "@/data/educationCategories";
import { useExploreByGoalPublic } from "@/hooks/useExploreByGoalPublic";
import { ChevronDown } from "lucide-react";

export const MegaMenu = () => {
  const { data: goals } = useExploreByGoalPublic();

  const handleGoalClick = (goal: any, e: React.MouseEvent) => {
    if (goal.link_type === 'external' && goal.link_url) {
      e.preventDefault();
      if (goal.open_in_new_tab) {
        window.open(goal.link_url, '_blank');
      } else {
        window.location.href = goal.link_url;
      }
    }
  };

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent hover:bg-accent">
            <span>All Courses</span>
            <ChevronDown className="ml-1 h-4 w-4" />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[800px] p-6">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Explore by Goal
                  </h3>
                  <ul className="space-y-2">
                    {goals?.map((goal: any) => (
                      <li key={goal.id}>
                        <Link
                          to={goal.link_type === 'courses' ? `/explore/${goal.slug}` : (goal.link_url || `/explore/${goal.slug}`)}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors block py-1"
                          onClick={(e) => handleGoalClick(goal, e)}
                        >
                          {goal.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Browse by Class/Exam
                  </h3>
                  <ul className="space-y-3">
                    {educationCategories.slice(0, 4).map((category) => (
                      <li key={category.id}>
                        <Link
                          to={`/courses?category=${category.slug}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors block"
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </Link>
                        <ul className="ml-6 mt-1 space-y-1">
                          {category.subcategories.slice(0, 3).map((sub) => (
                            <li key={sub}>
                              <Link
                                to={`/courses?category=${category.slug}&subcategory=${sub.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors block"
                              >
                                {sub}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Popular Subjects
                  </h3>
                  <ul className="space-y-2">
                    {popularSubjects.map((subject) => (
                      <li key={subject}>
                        <Link
                          to={`/courses?subject=${subject.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors block py-1"
                        >
                          {subject}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
