import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {expect,it,vi} from 'vitest'
import VisorActaModal from '@/components/mediaciones/VisorActaModal'
import {obtenerActaPDF} from '@/services/mediacionesService'
vi.mock('@/services/mediacionesService',()=>({obtenerActaPDF:vi.fn(),despacharActa:vi.fn()}))
vi.mock('@/components/mediaciones/LienzoFirmaModal',()=>({default:({onSaved})=><button onClick={onSaved}>Simular firma guardada por el servidor</button>}))
it('invalida el PDF anterior y vuelve a obtener el acta tras guardar una firma',async()=>{
 let resolvePdf
 const first=new Blob(['%PDF-anterior'],{type:'application/pdf'})
 const second=new Blob(['%PDF-con-firma'],{type:'application/pdf'})
 obtenerActaPDF.mockResolvedValueOnce(first).mockImplementationOnce(()=>new Promise(resolve=>{resolvePdf=resolve}))
 vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:acta')
 vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{})
 render(<VisorActaModal mediacion={{id:'m',folio:'MED'}} canSend onClose={()=>{}}/>)
 const download=screen.getByRole('button',{name:'Descargar acta PDF'})
 await waitFor(()=>expect(download).toBeEnabled())
 fireEvent.click(screen.getByRole('button',{name:'Simular firma guardada por el servidor'}))
 await waitFor(()=>expect(obtenerActaPDF).toHaveBeenCalledTimes(2))
 expect(download).toBeDisabled()
 resolvePdf(second)
 await waitFor(()=>expect(download).toBeEnabled())
 expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:acta')
})
