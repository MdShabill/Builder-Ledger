using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface IMaterialRepository
    {
        public Material GetMaterialInfo(int Id);
        public List<Material> GetAll();
    }
}
