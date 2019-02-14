void subpads() 
{
   TCanvas *c1 = new TCanvas("c1","c1", 4);
   
   c1->Divide(2,2);
   
   TFile *f = TFile::Open("./hsimple.root");
   
   c1->cd(1);
   f->Get("hpx")->Draw();
   
   // c1->Draw();

   c1->cd(2);
   f->Get("hpxpy")->Draw("colz");
   
   c1->Update();

   c1->cd(3);
   f->Get("hprof")->Draw("hist");
  
   c1->Update();

   
   c1->cd(4);
   f->Get("hpxpy")->Draw("lego");
   
   c1->Update();
   

}
