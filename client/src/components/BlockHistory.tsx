import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Block {
  id: number;
  hash: string;
  nonce: string;
  minedBy: string;
  createdAt: string;
  completedAt: string;
}

export function BlockHistory() {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  const { data: blocks } = useQuery({
    queryKey: ["/api/blocks/history"],
  });

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>Recent Blocks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Block #</TableHead>
                <TableHead>Hash (first 10 chars)</TableHead>
                <TableHead>Mined By</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks?.map((block: Block) => (
                <TableRow 
                  key={block.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setSelectedBlock(block)}
                >
                  <TableCell>{block.id}</TableCell>
                  <TableCell>{block.hash.slice(0, 10)}...</TableCell>
                  <TableCell>{block.minedBy}</TableCell>
                  <TableCell>
                    {new Date(block.completedAt).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedBlock} onOpenChange={() => setSelectedBlock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Details #{selectedBlock?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Hash</p>
              <p className="text-sm text-muted-foreground break-all">
                {selectedBlock?.hash}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Nonce</p>
              <p className="text-sm text-muted-foreground">
                {selectedBlock?.nonce}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Mined By</p>
              <p className="text-sm text-muted-foreground">
                {selectedBlock?.minedBy}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Created At</p>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedBlock?.createdAt || '').toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Completed At</p>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedBlock?.completedAt || '').toLocaleString()}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
