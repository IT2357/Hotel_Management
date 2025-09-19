import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/rooms/ui/card";
import { Badge } from "@/components/rooms/ui/badge";
import { Building, Users, MapPin } from "lucide-react";

const FloorSelector = ({ floors, selectedFloor, onFloorSelect }) => {
  if (!floors || floors.length === 0) return null; // no floors

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h3 className="text-2xl font-display font-bold text-foreground mb-2">
          Select Floor
        </h3>
        <p className="text-muted-foreground">
          Choose a floor to view available rooms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {floors.map((floor) => (
          <Card
            key={floor.id}
            className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-luxury ${
              selectedFloor === floor.id
                ? "border-primary shadow-glow bg-primary/5"
                : "hover:border-primary/50"
            }`}
            onClick={() => onFloorSelect(floor.number)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{floor.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Floor {floor.number}
                </Badge>
              </div>
              <CardDescription className="text-sm">{floor.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Rooms Available</span>
                  </div>
                  <span className="font-medium">{floor.roomCount}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Occupancy</span>
                  </div>
                  <span className="font-medium">
                    {floor.occupancy}/{floor.maxOccupancy}
                  </span>
                </div>

                {floor.features?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {floor.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FloorSelector;
