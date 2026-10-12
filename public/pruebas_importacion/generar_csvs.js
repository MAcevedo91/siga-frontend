const fs = require('fs');
const path = require('path');

const calcularDv = (cuerpo) => {
  let suma = 0, multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i), 10);
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const dvEsperado = 11 - (suma % 11);
  if (dvEsperado === 11) return '0';
  if (dvEsperado === 10) return 'K';
  return String(dvEsperado);
};

// Cursos de Enseñanza Básica (1° a 8° Básico, A y B)
const niveles = [
  { nivelNum: 1, nivelNombre: '1° Básico' },
  { nivelNum: 2, nivelNombre: '2° Básico' },
  { nivelNum: 3, nivelNombre: '3° Básico' },
  { nivelNum: 4, nivelNombre: '4° Básico' },
  { nivelNum: 5, nivelNombre: '5° Básico' },
  { nivelNum: 6, nivelNombre: '6° Básico' },
  { nivelNum: 7, nivelNombre: '7° Básico' },
  { nivelNum: 8, nivelNombre: '8° Básico' },
];

const letras = ['A', 'B'];

const nombres = [
  'Mateo', 'Agustina', 'Santiago', 'Sofía', 'Lucas', 'Emma', 'Benjamín', 'Isidora',
  'Vicente', 'Florencia', 'Gaspar', 'Emilia', 'Tomás', 'Julieta', 'Joaquín', 'Martina',
  'Maximiliano', 'Catalina', 'Alonso', 'Antonella', 'Facundo', 'Maite', 'Damián', 'Trinidad'
];

const apellidos = [
  'González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva',
  'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres',
  'Araya', 'Flores', 'Espinoza', 'Valenzuela', 'Castillo', 'Tapia', 'Reyes', 'Gutiérrez'
];

const calles = [
  'Av. Independencia', 'Los Aromos', 'Pje. Las Violetas', 'Av. San Martín',
  'Camino El Olivo', 'Av. Central', 'Calle Del Sol', 'Pje. Los Quillayes',
  'Calle Balmaceda', 'Pje. El Mañío', 'Av. Bernardo O Higgins', 'Calle Esmeralda'
];

let baseRutEstudiante = 24100000;
let baseRutApoderado = 16100000;

const headers = 'rut,nombre,apellido,curso,pie,direccion,apoderado_nombre,apoderado_apellido,apoderado_rut,apoderado_email,apoderado_telefono,direccion_apoderado';

const resumenArchivos = [];

niveles.forEach(({ nivelNum, nivelNombre }) => {
  letras.forEach((letra) => {
    const cursoNombre = `${nivelNombre} ${letra}`;
    const nombreArchivo = `estudiantes_${nivelNum}_basico_${letra.toLowerCase()}.csv`;
    const rutaArchivo = path.join(__dirname, nombreArchivo);

    const filas = [headers];

    // 10 estudiantes por curso
    for (let i = 0; i < 10; i++) {
      baseRutEstudiante += 113;
      baseRutApoderado += 187;

      const rutEst = `${baseRutEstudiante}-${calcularDv(String(baseRutEstudiante))}`;
      const rutApod = `${baseRutApoderado}-${calcularDv(String(baseRutApoderado))}`;

      const idxNom = (nivelNum * 5 + (letra === 'A' ? 0 : 7) + i) % nombres.length;
      const idxApe = (nivelNum * 3 + (letra === 'A' ? 0 : 9) + i) % apellidos.length;

      const nomEst = nombres[idxNom];
      const apeEst = apellidos[idxApe];
      const esPie = (i === 2 || i === 7) ? 'Sí' : 'No'; // 2 estudiantes PIE por curso
      const dirEst = `${calles[(nivelNum + i) % calles.length]} ${100 + i * 18}, San Felipe`;

      const nomApod = (i % 2 === 0) ? 'Rodrigo' : 'Claudia';
      const apeApod = apeEst;
      const emailApod = `apoderado.${nomEst.toLowerCase()}.${apeEst.toLowerCase()}@gmail.com`;
      const telApod = `+569${80000000 + (nivelNum * 1000) + (i * 145)}`;

      filas.push(`"${rutEst}","${nomEst}","${apeEst}","${cursoNombre}","${esPie}","${dirEst}","${nomApod}","${apeApod}","${rutApod}","${emailApod}","${telApod}","${dirEst}"`);
    }

    fs.writeFileSync(rutaArchivo, filas.join('\n'), 'utf8');
    resumenArchivos.push({ curso: cursoNombre, archivo: nombreArchivo, cantidad: 10 });
  });
});

console.log('Archivos actualizados con 10 alumnos por curso:');
console.table(resumenArchivos);
